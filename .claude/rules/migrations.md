---
paths:
  - "db/migrate/**/*.rb"
  - "db/schema.rb"
---

# Migration Conventions

- SQLite, **integer primary keys** (Rails default). No UUIDs
- **No `account_id`**. Revisa is not multi-tenant. Client isolation comes from `SiteAccess` + policies
- **No foreign key constraints**: `t.references :page, null: false, foreign_key: false` (strip `foreign_key: true` from generator output). The app enforces integrity
- `strong_migrations` is installed, so follow its advice
- Unique indexes enforce invariants: `[:page_id, :number]` on revisions, `[:site_id, :user_id]` on site_accesses,
  `:page_id` unique on drafts, `[:role_id, :permission_id]`, `[:user_id, :permission_id]`, `:name` on permissions/roles
- JSON columns (`t.json :sections, null: false, default: []`) for sections, secondary keywords and event particulars
- String columns for enum-like values (`verdict`, `source`, `kind`), not integers
- Author/actor columns are `references` to users with a clear name: `t.references :author, null: false` + `belongs_to :author, class_name: "User"`
- Always include `timestamps`. Immutable tables (revisions, reviews, events) still get both
- Small, reversible migrations, one concern per migration
- Never add boolean columns for business state (approved, resolved, published). Use state-record tables
