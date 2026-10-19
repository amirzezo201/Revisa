---
paths:
  - "app/controllers/**/*.rb"
  - "app/policies/**/*.rb"
  - "test/policies/**/*.rb"
  - "test/controllers/**/*.rb"
---

# Authorization Rules (Pundit + permissions)

Full recipe: the `permissions` skill. Design: `docs/plans/content-versioning.md`, under "Permissions and ownership".

## Model
- Permissions are named `"resource.action"` (`pages.update`, `reviews.approve`, `sites.index_own`)
- The catalogue is `Permission::CATALOGUE` (`app/models/permission.rb`), a hash of `{ "resource" => { "action" => "description" } }`.
  `bin/rails permissions:seed` (`Permission.seed`) syncs it. `Permission.obsolete` lists rows that are no longer in it (`permissions:cleanup_obsolete`)
- `User#has_permission?(name)` (in `User::Permissions`): the owner always returns true; otherwise it checks `permission_names` (the role's permissions plus direct `UserPermission` grants)
- `User#owner?`: one `Ownership` row (singleton guard). `Ownership.transfer_to!(user)` (the previous owner gets Admin if they have no role). `Ownership.claimable?` is true while there's no owner
- Only the owner manages roles (`RolePolicy`), direct grants (`UserPolicy#manage_permissions?`) and ownership (`OwnershipPolicy`). These are deliberately not permissions

## Policies
- `ApplicationPolicy` maps `index?/show?/create?/update?/destroy?` to the private `permission(:action)` -> `"<policy resource plural>.<action>"`.
  `new?` -> `create?`, `edit?` -> `update?`. `Scope` has the same private `permission` / `has_permission?` helpers
- Custom checks are policy methods named after the permission action: `approve?`, `import?`, `restore?`, `compare?`, `manage_access?`, `assign_role?`
- `permission(:x)` always uses the policy's **own** resource. For a check gated by another resource's permission (`PagePolicy#import?` -> `revisions.import`), write the full name: `has_permission?("revisions.import")`
- Meaning of `*_own` in the catalogue:
  - `sites.index_own`: sites the user has a `SiteAccess` row for (clients, writers)
  - `pages.update_own` / `drafts.update_own`: pages the user **created** (`creator_id`)
- Site visibility is the isolation boundary. `SitePolicy::Scope`: `sites.index` -> all; `sites.index_own` -> `SiteAccess` sites; otherwise `none`.
  Pages, revisions, comments and so on scope **through the visible sites** (`pages.index` means "pages on visible sites")
- Policies take `(user, record)`. No `Current` inside policies

## Controllers
- The `Authorization` concern (in `ApplicationController`) includes `Pundit::Authorization`, sets `pundit_user` to `Current.user`, and runs
  `after_action :verify_authorized` plus `after_action :verify_policy_scoped, only: :index`. A missing check raises. That's a bug, not a style issue
- `rescue_from Pundit::NotAuthorizedError` redirects back with an alert ("You don't have permission to do that."). Don't rescue it per action
- Pattern: `@role = authorize policy_scope(Role).find(params[:id])` (`authorize` returns the record). Index: `authorize Page` + `policy_scope(Page)`. New/create: `authorize Model` / `authorize @record`
- Custom check: `authorize @revision, :approve?`
- Controllers with nothing to authorize (sessions, sign-up, invitations, own settings, dashboard) opt out with the class macro
  **`skip_authorization_check`** (it accepts `only:`/`except:`). It skips both `verify_authorized` and `verify_policy_scoped`. Never call `skip_after_action :verify_authorized` directly
- Never branch on role names (`user.role.name == "Admin"`). Always check permissions

## Frontend
- `auth.user` is `CurrentUserResource`: `UserResource` + `is_owner` + `permissions` (the owner gets `["*"]`). TS type: `CurrentUser`
- In components: `const can = useCan()` (`@/hooks/use-can`) then `can("reviews.approve")`. Outside hooks: `can(user, name)` / `canAny(user, ...names)` from `@/lib/permissions`
- This only hides UI. The server is always the gate
- A new resource gets a label in `resourceLabels` and a slot in `AREAS` (`app/frontend/lib/permissions.ts`). Action text comes from the catalogue description

## Tests
- Fixtures: `permissions.yml` and `role_permissions.yml` are ERB-generated from `Permission::CATALOGUE` and `Role::Templates`, so don't hand-edit them.
  Users: `one` (owner), `admin`, `seo`, `two` (writer), `client` (client_reviewer), `no_role`
- Policy test per policy: each role, the owner bypass, `no_role`, and **a client cannot see another client's site** (scope + show)
- Controller tests: an authorized user succeeds, an unpermitted user is redirected with the alert, and another client's record returns 404
