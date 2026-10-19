---
paths:
  - "app/models/**/*.rb"
  - "test/models/**/*.rb"
---

# Model Conventions

- Rich domain models: business logic in models and POROs under `app/models` (`Revision::Import`, `Revision::Diff`), not services
- Concerns for horizontal behavior (`Eventable`, `Role::Templates`). Keep each one narrowly focused
- State as records, not booleans: `has_one :submission`, `has_many :reviews`, `has_one :resolution`
- Status is **derived** (`Page#status`, `Page#needs_rebuild?`), never stored in a column
- `Revision` is immutable: `def readonly? = persisted?`. Corrections create a new revision
- `belongs_to` defaults via lambdas: `belongs_to :author, class_name: "User", default: -> { Current.user }`
- `touch: true` on child -> parent associations where the parent's cache or `updated_at` matters
- `where.missing(:resolution)` / `where.associated(:submission)` for state scopes
- `_later`/`_now` for async/sync method pairs
- Model methods are the public API that controllers call (`page.save_draft_as_revision!(summary:)`)
- **Models never call Pundit** and never read `Current.user` for authorization. Authorization lives in policies
- No `account_id`. Site scoping is done by policies (see `rules/authorization.md`)
- No DB foreign keys, so declare `dependent:` on every `has_many`/`has_one` and validate presence where needed
