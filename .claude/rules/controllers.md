---
paths:
  - "app/controllers/**/*.rb"
  - "test/controllers/**/*.rb"
  - "config/routes.rb"
---

# Controller Conventions

- Controllers inherit `InertiaController` (which inherits `ApplicationController`, with `Authentication` and Pagy)
- Only the 7 REST actions: index, show, new, create, edit, update, destroy
- No custom actions. A state change becomes a nested singular resource:
  `resource :submission, only: :create` -> `Revisions::SubmissionsController#create`
- Use `scope module:` / nested `resources` for namespacing (`Pages::ImportsController`, `Revisions::ReviewsController`)
- Thin: load through `policy_scope`, `authorize`, call **one** model method, then respond
- Every action calls `authorize` (and index actions call `policy_scope`). See `rules/authorization.md`
- Never `Model.find(params[:id])` directly. Use `policy_scope(Page).find(params[:id])` or go through a scoped parent
- Pass data explicitly: `render inertia: { page: PageResource.new(@page).to_h }`. Instance variables are **not** auto-serialized into props
- `inertia_config default_render: true` lets prop-less actions render `<controller>/<action>` implicitly
- Success: `redirect_to <path>, notice: "..."` (PRG). Validation failure: `redirect_to <form path>, inertia: { errors: record.errors }`
- External URLs (downloads on another host, OAuth) use `inertia_location`, never `redirect_to`
- File downloads (source .docx, exports) use `send_data` / `redirect_to rails_blob_path(...)` from a GET on a CRUD resource
- After you change `config/routes.rb`, run `bin/rails js:routes` so `@/routes` stays in sync (CI checks this)
- No `respond_to`/`turbo_stream`. This app has no Hotwire
