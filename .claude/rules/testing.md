---
paths:
  - "test/**/*.rb"
  - "test/fixtures/**/*.yml"
  - "test/fixtures/files/**"
---

# Testing Conventions

- Minitest only, never RSpec. Fixtures only, never FactoryBot
- Use fixture accessors (`users(:one)`, `pages(:acme_home)`), not `create`/`build` for setup data
- Controller tests: `ActionDispatch::IntegrationTest` + `sign_in(user)` from `test/test_helpers/session_test_helper.rb`
- Inertia assertions (`require "inertia_rails/minitest"` in `test_helper.rb`): `assert_inertia_component "pages/show"`,
  `assert_inertia_props page: { ... }`, `assert_inertia_flash notice: "..."`. After POST/PATCH/DELETE + redirect,
  call `follow_redirect!` before asserting flash/props
- Policy tests in `test/policies/*_policy_test.rb` cover each role template, the owner bypass, and **a client can't see another client's site**
- Every new controller gets at least: an authorized happy path, a forbidden user, and a cross-site (other client) case
- Word import tests use real `.docx` fixtures in `test/fixtures/files/` (`file_fixture("v1.docx")`)
- Model tests cover: revision immutability, sequential numbering, status derivation, diff output, digest dedupe
- Test behavior and outcomes, not implementation details. `assert`/`refute`, `assert_difference`
- Role/permission fixtures: `permissions.yml` and `role_permissions.yml` are **ERB-generated** from `Permission::CATALOGUE` / `Role::Templates` (don't hand-edit them).
  Users: `one` (owner), `admin`, `seo`, `two` (writer), `client` (client_reviewer), `no_role`. Roles: `admin`, `seo`, `writer`, `client_reviewer`
- No cross-*account* tests. This app has no accounts. Test cross-*site* isolation instead
