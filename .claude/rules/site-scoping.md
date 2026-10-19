---
paths:
  - "app/models/**/*.rb"
  - "app/controllers/**/*.rb"
  - "app/policies/**/*.rb"
  - "db/migrate/**/*.rb"
---

# Site Scoping (replaces multi-tenancy)

Revisa is **not** multi-tenant: there's no `account_id`, no `Current.account` and no tenant in the URL.
One team works on many client `Site`s, and clients log in.

- Visibility is decided by **permissions + `SiteAccess`**, not by a tenant column:
  - `sites.index` -> all sites (team roles)
  - `sites.index_own` -> only sites with a `SiteAccess` row for the user (clients, writers)
  - `pages.index` means "pages on the sites I can see". There's no `pages.index_own`
  - `pages.update_own` / `drafts.update_own` are about **authorship** (`page.creator == user`), not site access
- Every model hangs off a `Site` (`Page belongs_to :site`, `Revision -> page -> site`, ...). Don't denormalize `site_id` onto deep children unless a query really needs it
- **Every lookup goes through `policy_scope`** (or through a record that was loaded via `policy_scope`):
  `page = policy_scope(Page).find(params[:page_id])`, then `page.revisions.find(params[:id])`
- No `default_scope` for visibility. Scoping is explicit, in policies
- Background jobs and mailers that fan out to people (for example "v4 ready for review") must pick recipients
  who can see the site: `site.users_who_can("reviews.approve")`-style model methods, never "all users"
- Tests: always include a second client with a second site and assert it can't be reached
