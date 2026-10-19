# Revisa: content versioning plan

## The problem

The SEO team (2–3 people) sends page content as **Word documents**. The content
goes back and forth through several versions with the team and the client until
someone with approval rights signs it off. The approved copy is then built
**by hand** into WordPress/Elementor pages. Today nobody can easily answer:

- Which version is the latest one, and which one was approved?
- What changed between v3 and v5? Which sections stayed the same?
- Who changed it, when, and why?
- Which approved version did we actually build into WordPress?

Revisa should answer each of these in one click.

## Decisions made

| Question | Decision |
|---|---|
| Permissions | Ported from behnke-rails: an owner, roles, permissions and per-user grants. The owner configures everything in the UI |
| Who approves | Anyone whose permissions include `reviews.approve`. **One approval is enough** |
| Clients | **Clients log in.** They usually get the Reviewer role and see **only their own sites** |
| Content source | **Word (.docx) upload.** Each upload becomes a new version, so changes between uploads show up in the diff |
| WordPress/Elementor | **Built by hand.** Revisa gives clean copy/export and lets you mark a version as built. There's no WP API integration |
| Sites | Several client sites. *(Assumed because clients log in. Confirm if wrong.)* |

## Current state of the repo

- Inertia Rails starter kit: Rails 8.1, **React + Vite + shadcn (base-ui)**, Alba
  resources, SQLite, Solid Queue/Cache/Cable, integer IDs, `has_secure_password` auth.
- Only `User` and `Session` models so far.
- `.claude/CLAUDE.md` describes a **different stack** (Hotwire, Importmap, UUIDv7,
  passkeys, multi-tenant `account_id`, no Pundit). Claude will follow it and
  produce the wrong code, so fixing it is step 0.

## Core idea: drafts are mutable, revisions are immutable

```
Site ─┬─ SiteAccess (which users/clients can see this site)
      └─ Page ─┬─ Draft (one, mutable, autosaved working copy)
               ├─ Revision v1 ─ v2 ─ v3 ...   (immutable snapshots)
               │      ├─ source_document (the uploaded .docx, if any)
               │      ├─ Submission     (sent for review)
               │      ├─ Reviews        (approved / changes requested + note)
               │      └─ Comments       (anchored to a section) ─ Resolution
               ├─ Publications          ("v4 built in WordPress at <url>")
               └─ Events                (activity timeline)
```

- **There are two ways to create a version:**
  1. **Upload a Word doc.** It's parsed into sections and saved straight away as
     Revision vN, with the original .docx attached.
  2. **Edit in Revisa.** You change the Draft (with autosave), then "Save as
     version" freezes it into Revision vN with a required one-line change summary.
- Revisions are **never updated**. Corrections always create a new revision, so
  the history can be trusted.
- Content is **structured into sections** instead of one blob. Each section has a
  stable `key` (for example `hero`, `intro`, `faq`, `cta`), so diffs can say
  "hero changed, FAQ unchanged". Sections also line up one-to-one with the blocks
  you build in Elementor.

## Data model

| Model | Key columns | Notes |
|---|---|---|
| `Site` | name, url | One per client website |
| `SiteAccess` | site_id, user_id (unique pair) | Which sites a user with only `*_own` permissions can see. Clients get access to their own site(s) |
| `Page` | site_id, title, slug, target_keyword, secondary_keywords (json), page_type, creator_id, live_url | The content piece being worked on |
| `Draft` | page_id, title, meta_title, meta_description, sections (json), base_revision_id, updated_by_id | One per page. `base_revision_id` detects "someone saved a version while you were editing" |
| `Revision` | page_id, number, title, meta_title, meta_description, sections (json), change_summary, source (`upload` / `editor` / `restore`), author_id, parent_id, content_digest | Immutable (`readonly?` after create). `number` is sequential per page. `has_one_attached :source_document`. `content_digest` blocks duplicate uploads ("identical to v3") |
| `Submission` | revision_id, submitter_id, note | State record: "this revision is up for review" |
| `Review` | revision_id, reviewer_id, verdict (`approved` / `changes_requested`), note | One approval from someone with `reviews.approve` approves the revision |
| `Comment` | revision_id, section_key, quoted_text, body, author_id, internal (bool) | Feedback anchored to a section. `internal` comments are hidden from users without `comments.view_internal`, so clients don't see team chatter |
| `Resolution` | comment_id, resolver_id | State record: the comment is resolved |
| `Publication` | page_id, revision_id, publisher_id, live_url, note | **Manual** "I built v4 into WordPress". Records which version is live |
| `Event` | page_id, eventable (poly), action, creator_id, particulars (json) | Timeline: "Sara uploaded v3 (Word)", "Client approved v4" |
| `User` | + `role_id` | Permissions come from the role plus direct grants (see below) |

Each section is stored as `{ key, kind, heading, body_html }`. `kind` is one of
`heading | rich_text | faq | cta | list`.

**Deliberate deviations from the 37signals template:** no `account_id` (one team;
client isolation is handled by `SiteAccess` plus the `*_own` permissions),
integer IDs, and Pundit for authorization. All three get written into the
corrected CLAUDE.md.

### Status is derived, never stored

`Page#status` is computed from the records:

1. `published`: the latest publication is for the current approved revision
2. `approved`: the latest revision has an approving review
3. `changes_requested`: the latest review on the latest revision asks for changes
4. `in_review`: the latest revision has a submission and no reviews yet
5. `draft`: none of the above

Plus a flag: **`needs_rebuild`**, meaning a newer approved revision exists than
the one marked as built in WordPress. That tells the person building pages what
to update.

## Word import

- `Revision::Import` (a model PORO): .docx → HTML → sections.
  - **Conversion with `pandoc`** (installed in the Dockerfile): it gives the best
    fidelity for headings, lists, bold/italic, links and tables. With
    `--track-changes=accept`, a doc that still has tracked changes imports cleanly.
  - **Splitting**: every Heading 1/Heading 2 starts a new section. The section
    `key` is matched against the previous revision's headings, so a renamed
    heading in v4 still lines up with v3. New headings get new keys.
  - **Metadata lines**: lines like `Meta Title: …`, `Meta Description: …`,
    `Keyword: …` and `URL: …`, which SEO docs usually include, are pulled into
    the matching fields instead of the body.
  - Images in the doc are dropped, with a warning. Elementor images are handled
    when the page is built.
- Upload flow: drop a .docx on the page, preview the parsed sections and the
  diff against the latest version, add a change summary, then save as vN.
- Bulk start: drop several .docx files on a site to create one page per file (each
  starting at v1).
- The original file stays attached to its revision, so it can always be downloaded.

## What changed: the diff engine

- `Revision#diff_against(other)` returns a `Revision::Diff` object (a PORO under `app/models`).
  - Sections are matched by `key`. Each section is classified as **added / removed /
    changed / unchanged / moved**.
  - Inside changed sections, the diff is **word-level**, done on text extracted
    from the HTML (`diff-lcs` gem).
  - Field-level changes are reported for title, meta title, meta description and
    keywords. Meta title and description also show **SERP length checks**
    (60 and 155 characters).
  - The diff produces a summary line, for example: "2 sections changed, 1 added,
    meta description changed, +84 / −31 words".
- UI: compare any two versions, with inline or side-by-side views. A toggle hides
  unchanged sections. Shortcuts: **"vs previous"**, **"since last approved"** (for
  reviewers) and **"since last built"** (for whoever updates Elementor: exactly
  what to change on the live page).
- Rendering: the server sends diff ops through an Alba resource, and React renders
  them. No diffing happens on the client.

## Elementor hand-off (manual build)

- On an approved revision, each section has **Copy** buttons (rich HTML and plain
  text), so you can paste them one by one into Elementor widgets.
- **Export**: the full page as clean HTML or .docx, in section order, with the
  meta title and description at the top.
- **"Mark as built"** creates a Publication (live URL plus an optional note).
  After that, the page shows `published`. When a newer version is approved later,
  it flips to `needs_rebuild` and links to the "since last built" diff.

## Permissions and ownership (ported from behnke-rails)

This copies the system in `~/Documents/GitHub/behnke-rails` almost exactly.

**Models (copied as-is):**

| Model | Columns | Role |
|---|---|---|
| `Permission` | name (`resource.action`, unique), resource, action, description | The catalogue of everything that can be gated. `Permission.catalogue` groups it by resource for the picker UI |
| `Role` | name (unique), description | `has_many :permissions, through: :role_permissions`. `restrict_with_error` while users are assigned |
| `RolePermission` | role_id, permission_id (unique pair) | Join table |
| `UserPermission` | user_id, permission_id (unique pair) | Direct per-user grants on top of the role |
| `Ownership` | user_id (unique), singleton_guard (unique, always 0) | **The one system owner.** Bypasses every check, is the only one who can manage roles and direct grants, and can't be deleted until ownership is transferred (`Ownership.transfer_to!`) |
| `Role::Templates` concern | | Starter permission sets: you create a role from a template or copy another role's permissions, then fine-tune it |

**How checks work:**
- `User#owner?` checks whether an ownership exists. `User#has_permission?("pages.update")`
  returns true for the owner, otherwise it checks the role's permissions and the
  direct grants.
- **Pundit policies** (`app/policies/`): `ApplicationPolicy` maps
  `index?/show?/create?/update?/destroy?` to `"<resource>.<action>"`
  automatically, and custom actions add methods (`approve?`, `import?`).
  `RolePolicy` is owner-only. `UserPolicy#manage_permissions?` requires the owner,
  and the owner's own grants can't be edited.
- **Scopes for clients**: `SitePolicy::Scope` / `PagePolicy::Scope` return
  everything for `sites.index`, but only `SiteAccess` sites for `sites.index_own`.
  Every page, revision and comment lookup goes through `policy_scope`, so a client
  can never reach another client's site, even by guessing an ID.
- `InertiaController` has `after_action :verify_authorized` and
  `verify_policy_scoped` on index actions, so a forgotten check fails loudly
  instead of allowing access.
- Shared Inertia prop `auth.user = { is_owner, permissions: [...] }` (the owner
  gets `["*"]`). The frontend uses a `can("reviews.approve")` helper to hide
  buttons. The server stays the real gate.
- `bin/rails permissions:seed` / `permissions:seed_roles` / `permissions:make_owner[email]`
  are rake tasks that are safe to re-run. The first sign-up becomes the owner;
  after that, sign-up is closed and the owner invites users and clients.

**Revisa permission catalogue:**

| Resource | Actions |
|---|---|
| `sites` | index, index_own, show, create, update, destroy, manage_access |
| `pages` | index, index_own, show, create, update, update_own, destroy |
| `drafts` | update, update_own |
| `revisions` | index, show, create, import, restore, compare, download_source |
| `submissions` | create |
| `reviews` | approve, request_changes |
| `comments` | create, create_internal, view_internal, resolve, destroy |
| `publications` | export, create (mark as built) |
| `users` | index, show, create, update, destroy, assign_role |

**Role templates (seeded, all editable by the owner):**

| Role | Template | Can |
|---|---|---|
| Admin | `full_access` | Everything |
| SEO | `seo` | All sites: create pages, import Word docs, edit, version, submit, **approve / request changes**, internal comments, export, mark as built |
| Writer | `writer` | Assigned sites: edit, import, version, submit, comment, compare. Can't approve |
| Client Reviewer | `client_reviewer` | **Own sites only**: view, compare, comment (not internal ones), **approve / request changes** |

Whether clients may approve is just a checkbox on the Client Reviewer role. Take
`reviews.approve` off the role and clients can comment and request changes but
not approve.

**Admin UI (Inertia pages, ported from behnke's `admin/roles` and `admin/users`):**
- `admin/roles` index/new/edit: create from a template or copy a role, then use a
  permission picker grouped into areas (Content, Review, Publishing, Users &
  Sites), with "action implies view" auto-ticking (`impliedViewId`)
- `admin/users` index/new/edit: invite by email, assign a role, add direct grants
  (owner only), and **grant site access** (for example, the client gets their site)
- `settings/ownership`: transfer ownership (owner only)

## Workflow (every action is CRUD)

| Action | Route | Permission |
|---|---|---|
| Upload Word doc → new version | `POST /pages/:id/imports` | `revisions.import` |
| Save draft (autosave) | `PATCH /pages/:id/draft` | `drafts.update` / `update_own` |
| Save as version | `POST /pages/:id/revisions` | `revisions.create` |
| Restore old version into draft | `POST /revisions/:id/restoration` | `revisions.restore` |
| Submit for review | `POST /revisions/:id/submission` | `submissions.create` |
| Approve / request changes | `POST /revisions/:id/reviews` | `reviews.approve` / `reviews.request_changes` |
| Comment / resolve | `POST /revisions/:id/comments`, `POST /comments/:id/resolution` | `comments.create` / `comments.resolve` |
| Compare | `GET /pages/:id/comparison?from=3&to=5` | `revisions.compare` |
| Export | `GET /revisions/:id/export.(html\|docx)` | `publications.export` |
| Mark as built in WordPress | `POST /pages/:id/publications` | `publications.create` (approved revisions only) |

Notifications are sent by email through Solid Queue jobs (`_later`): "v4 is ready
for review" goes to everyone who can approve on that site (including clients),
then "changes requested on v4", "v4 approved, ready to build" and "comment on v4".

## Frontend pages (Inertia + React + shadcn)

- `sites/index`, `sites/show`: pages table with status badges, filter by status/keyword
- `pages/show`: sections editor (Tiptap per section), a Word upload dropzone, and a
  sidebar showing versions, reviews and comments
- `pages/imports/new`: upload preview (parsed sections plus a diff against the latest)
- `pages/revisions/index`: version timeline (number, source icon, author, summary, status chips)
- `pages/comparisons/show`: diff viewer
- `pages/revisions/show`: read-only snapshot with comments, copy buttons and export
- Client view: the same pages, with editing hidden by permissions. A simple
  "Review v4" screen offers **Approve** and **Request changes**
- Dashboard: "Waiting on me" (reviews to do, changes requested on my pages),
  "Approved, needs building", "Needs rebuild"

## Phases

**Phase 0: Foundations**
1. Rewrite `.claude/CLAUDE.md` for the real stack (Inertia/React/Vite/Alba,
   SQLite, integer IDs, no `account_id`, Pundit) and add a domain glossary.
2. Fix `.claude/rules/*`: drop the `account_id`, Hotwire and Stimulus rules; add
   `frontend.md` and `authorization.md`.
3. Create the project skills (below) and point `implement-agent` at them.
4. Port permissions from behnke-rails: Permission, Role, RolePermission,
   UserPermission, Ownership, Role::Templates, Pundit policies,
   `verify_authorized`, the shared `auth.permissions` prop, the `can()` helper,
   the rake tasks, the admin roles/users UI and ownership transfer. Make the
   first sign-up the owner, then close public sign-up and switch to invites.

**Phase 1: Versioning core**: Site + SiteAccess, Page, Draft, Revision,
**Word import**, "save as version", history, restore, diff engine plus
comparison page.

**Phase 2: Review loop**: Submission, Review (single approval), client
access, Comment (internal/client)/Resolution, Event timeline, email
notifications, dashboard queues.

**Phase 3: Hand-off**: copy buttons, HTML/.docx export, "mark as built"
(Publication), `needs_rebuild` and the "since last built" diff.

Each phase is test-first with Minitest and fixtures. Model tests cover
immutability, numbering, status derivation, diff output and Word import (fixture
.docx files in `test/fixtures/files`). Policy tests cover each role template,
and especially **a client can't see another client's site**. Controller tests
use the `inertia_rails` matchers.

## Project skills to create in `.claude/skills/`

| Skill | Purpose / triggers |
|---|---|
| `revisa-domain` | Glossary and model map (Site/Page/Draft/Revision/…), status derivation rules, invariants (revisions immutable, numbers sequential, one approval approves, only approved revisions can be marked as built). Loaded first for any feature work |
| `permissions` | Adding a permission (seed entry, policy method, label/area in `permissions.ts`, role template), `authorize`/`policy_scope` in every controller action, `*_own` and SiteAccess scoping, the owner bypass, frontend `can()`, policy tests |
| `content-versioning` | How to add a versioned field (it must exist on Draft and Revision, be included in the digest and be handled by the diff and the export), how "save as version", restore and conflict detection via `base_revision_id` work |
| `word-import` | The pandoc pipeline, heading → section splitting, key matching against the previous revision, metadata-line extraction, how to add a new recognised line, and fixture .docx tests |
| `review-workflow` | State records (Submission/Review/Resolution/Publication), how to add a new transition as a CRUD resource, permission checks, internal vs client comments, events and notifications |
| `content-diff` | `Revision::Diff` API, section matching, word-level diff, output format, React diff component conventions, test fixtures for diffs |
| `inertia-feature` | Project recipe for a full slice: route, thin controller with `authorize`, Alba resource with Typelizer types, React page under `app/frontend/pages`, shadcn components, controller test |

Existing skills to keep: `model-patterns`, `state-records`, `concern-patterns`,
`job-patterns`, `migration-patterns`, `testing-patterns`, `event-tracking`,
`inertia-rails-*`. Remove `multi-tenant-setup` and `stimulus-patterns`; they don't
apply to this repo.

## Still open

1. **Several client sites?** The plan assumes yes.
2. **Word doc conventions**: please send 1–2 real SEO docs (they can be
   anonymised). The import rules (which headings split sections, how the meta
   lines are written) should match them, and they become the test fixtures.
