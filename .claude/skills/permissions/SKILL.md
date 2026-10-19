---
name: permissions
description: >-
  Revisa's authorization system (Pundit + Permission/Role/RolePermission/
  UserPermission/Ownership, ported from behnke-rails). Use when adding or
  changing a permission, writing a policy or policy scope, gating a controller
  action, hiding UI with useCan()/can(), editing role templates, handling
  *_own / SiteAccess visibility, ownership or invites, or writing policy
  tests. Also use when you see Pundit::NotAuthorizedError,
  AuthorizationNotPerformedError or PolicyScopingNotPerformedError.
  WHEN NOT: Authentication or sessions (use auth-setup), general controller
  structure (use inertia-feature), the domain model itself (use revisa-domain).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, Pundit, Inertia Rails + React
---

# Permissions

Design: `docs/plans/content-versioning.md`, under "Permissions and ownership". Quick rules: `.claude/rules/authorization.md`.

## Map of the code

| Piece | Where |
|---|---|
| Catalogue | `Permission::CATALOGUE` in `app/models/permission.rb`, `{ "resource" => { "action" => "description" } }` |
| Sync | `Permission.seed` / `bin/rails permissions:seed`; `Permission.obsolete` / `permissions:cleanup_obsolete` |
| Role templates | `app/models/role/templates.rb`: `SEO`, `WRITER`, `CLIENT_REVIEWER` arrays, `TEMPLATES`, `SEEDED_ROLES`, `Role.seed` |
| User checks | `app/models/user/permissions.rb`: `owner?`, `has_permission?(name)`, `permission_names` (role + direct grants, memoized) |
| Owner | `Ownership` (singleton): `Ownership.owner`, `.claimable?`, `.transfer_to!(user)`. `User.sign_up_first_owner(attrs)`; everyone else uses `User.invite(attrs)` (sends `UserMailer#invitation`) |
| Policies | `app/policies/`: `ApplicationPolicy` (+ `Scope`), `RolePolicy` and `OwnershipPolicy` (owner-only), `UserPolicy` |
| Controller wiring | `app/controllers/concerns/authorization.rb`: Pundit, `pundit_user` = `Current.user`, `verify_authorized`, `verify_policy_scoped` (index), `rescue_from` -> redirect back with an alert, `skip_authorization_check` macro |
| Shared prop | `CurrentUserResource` -> `auth.user.is_owner`, `auth.user.permissions` (the owner gets `["*"]`) |
| Frontend | `@/lib/permissions`: `can(user, name)`, `canAny(user, ...names)`, `resourceLabels`, `AREAS`, `groupByArea`, `impliedViewIds`. `@/hooks/use-can`: `useCan()`. Picker: `@/components/permission-picker` (`PermissionPicker`) |
| Admin UI | `Admin::RolesController`, `Admin::UsersController`, pages in `app/frontend/pages/admin/{roles,users}/` |

## Adding a permission end to end

Example: let comment authors delete their own comments (`comments.destroy_own`).

### 1. Catalogue

```ruby
# app/models/permission.rb
"comments" => {
  # ...
  "destroy" => "Delete comments",
  "destroy_own" => "Delete comments they wrote"
},
```

Run `bin/rails permissions:seed`. The test fixture `permissions.yml` is ERB-generated from the catalogue, so it picks this up automatically.

### 2. Role templates

```ruby
# app/models/role/templates.rb
WRITER = %w[
  ...
  comments.create comments.create_internal comments.view_internal comments.resolve comments.destroy_own
  ...
].freeze
```

`full_access` (Admin) resolves to every permission. `role_permissions.yml` is ERB-generated from the templates, so fixtures follow too.
**Deploy note:** `Role.seed` re-syncs only Admin. Curated roles (SEO/Writer/Client Reviewer with permissions already set) are left alone, so in production the owner ticks the new box in Admin > Roles. Say so in the PR.

### 3. Frontend labels

Action text comes from the catalogue description, so there's nothing to do for a new action on an existing resource. For a **new resource**, add it to `resourceLabels` and to one of the `AREAS` (`content`, `versions`, `review`, `handoff`, `people`) in `app/frontend/lib/permissions.ts`. Otherwise it lands in "Other". `impliedViewIds` already ticks `index`/`index_own`/`show` when a non-view action is picked (`*_own` actions prefer `index_own`).

### 4. Policy

```ruby
# app/policies/comment_policy.rb
class CommentPolicy < ApplicationPolicy
  def destroy?
    has_permission?(permission(:destroy)) ||
      (has_permission?(permission(:destroy_own)) && record.author == user)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      visible = scope.where(revision: RevisionPolicy::Scope.new(user, Revision).resolve)

      if has_permission?(permission(:view_internal))
        visible
      else
        visible.where(internal: false)
      end
    end
  end
end
```

`permission` and `has_permission?` are private helpers on both the policy and its `Scope`.

**Cross-resource checks:** `permission(:x)` always uses the policy's own resource. When an action on a page is gated by a permission of another resource (importing into a page is `revisions.import`, comparing is `revisions.compare`), write the full name:

```ruby
class PagePolicy < ApplicationPolicy
  def import? = has_permission?("revisions.import") && show?
  def compare? = has_permission?("revisions.compare") && show?
  def create_revision? = has_permission?("revisions.create") && show?
end
```

### 5. Controller

```ruby
class CommentsController < InertiaController
  def destroy
    comment = authorize policy_scope(Comment).find(params[:id])
    comment.destroy!

    redirect_back_or_to root_path, notice: "Comment deleted"
  end
end
```

Load through `policy_scope` **first**, then `authorize`. Another client's comment raises `RecordNotFound` (404) instead of a 403 that would confirm it exists.

### 6. UI

```tsx
import { useCan } from "@/hooks/use-can"

const can = useCan()
const { auth } = usePage().props

{(can("comments.destroy") ||
  (can("comments.destroy_own") && comment.author_id === auth.user.id)) && (
  <Button variant="ghost" size="sm" render={<Link href={commentPath(comment.id)} method="delete" as="button" />}>
    Delete
  </Button>
)}
```

For per-record decisions that are more than "has permission", send a server-computed flag in the resource instead (`can_destroy: CommentPolicy.new(user, comment).destroy?` via Alba `params:`). Don't re-implement policy logic in TS.

### 7. Tests: see below.

## Site scoping

Sites are the isolation boundary. Everything else scopes through visible sites:

```ruby
class SitePolicy < ApplicationPolicy
  def show?
    has_permission?(permission(:show)) && Scope.new(user, Site).resolve.exists?(record.id)
  end

  def manage_access?
    has_permission?(permission(:manage_access))
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if has_permission?(permission(:index))
        scope.all
      elsif has_permission?(permission(:index_own))
        scope.where(id: SiteAccess.where(user: user).select(:site_id))
      else
        scope.none
      end
    end
  end
end

class PagePolicy < ApplicationPolicy
  # pages.update_own = pages the user created
  def update?
    has_permission?(permission(:update)) ||
      (has_permission?(permission(:update_own)) && record.creator == user)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if has_permission?(permission(:index))
        scope.where(site: SitePolicy::Scope.new(user, Site).resolve)
      else
        scope.none
      end
    end
  end
end

class RevisionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve = scope.where(page: PagePolicy::Scope.new(user, Page).resolve)
  end
end
```

- Child resources load through a scoped parent: `page = policy_scope(Page).find(params[:page_id])`, then `page.revisions.find(params[:id])`
- Internal comments (and events about them) are filtered in the scope, never in React

## Owner-only things

`RolePolicy`, `OwnershipPolicy` and `UserPolicy#manage_permissions?` check `user.owner?`. Nobody else can edit the owner (`UserPolicy#update?/destroy?/assign_role?`). The owner can't be destroyed (`User::Permissions` aborts). Don't add permissions for these. They're deliberately not delegatable.

## Controllers with nothing to authorize

```ruby
class Settings::ProfilesController < InertiaController
  skip_authorization_check # acts on Current.user only
end
```

`skip_authorization_check(only: ...)` skips both verifications. Don't use `skip_after_action :verify_authorized` directly.

## Tests

Fixture users: `one` (owner, via `ownerships.yml`), `admin`, `seo`, `two` (writer), `client` (client_reviewer), `no_role`. When site fixtures exist, add a second client with a different site to prove isolation (for example `client` -> `acme`, a new `globex_client` -> `globex`, via `site_accesses.yml`).

```ruby
# test/policies/page_policy_test.rb
require "test_helper"

class PagePolicyTest < ActiveSupport::TestCase
  test "owner sees every page" do
    assert_equal Page.count, PagePolicy::Scope.new(users(:one), Page).resolve.count
  end

  test "seo sees pages on all sites" do
    assert_includes PagePolicy::Scope.new(users(:seo), Page).resolve, pages(:globex_home)
  end

  test "client cannot see another client's site" do
    scope = PagePolicy::Scope.new(users(:client), Page).resolve

    assert_includes scope, pages(:acme_home)
    refute_includes scope, pages(:globex_home)
  end

  test "writer edits only pages they created" do
    assert PagePolicy.new(users(:two), pages(:acme_home)).update?   # creator: two
    refute PagePolicy.new(users(:two), pages(:acme_about)).update?  # creator: seo
  end

  test "user without a role sees nothing" do
    assert_empty PagePolicy::Scope.new(users(:no_role), Page).resolve
  end
end
```

```ruby
# controller test
test "client gets 404 for another client's page" do
  sign_in users(:client)
  get page_path(pages(:globex_home))
  assert_response :not_found
end

test "writer cannot approve" do
  sign_in users(:two)
  assert_no_difference -> { Review.count } do
    post revision_reviews_path(revisions(:acme_home_v2)), params: { review: { verdict: "approved" } }
  end
  assert_equal "You don't have permission to do that.", flash[:alert]
end
```

## Checklist

- [ ] Entry in `Permission::CATALOGUE` (and `bin/rails permissions:seed`)
- [ ] Added to the right `Role::Templates` arrays (deploy note for curated roles)
- [ ] New resource? `resourceLabels` + `AREAS` in `app/frontend/lib/permissions.ts`
- [ ] Policy method and/or scope
- [ ] `authorize policy_scope(...).find(...)` in the controller (or `skip_authorization_check` with a reason)
- [ ] `useCan()` in the UI where the button or link appears
- [ ] Policy test (owner, each role, `no_role`, cross-client) + controller test
