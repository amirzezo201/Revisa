---
paths:
  - "app/integrations/**/*.rb"
---

# Third-Party Integration Conventions

External HTTP API clients (McLeod, Samsara, future vendors) live in `app/integrations/`,
not `app/models/` and not `app/services/`. They are transport adapters, not domain
objects -- the "rich models over service objects" rule is about business logic, not
about where every PORO has to sit. `app/integrations` is autoloaded the same way as
`app/tools` (see `config/application.rb`).

## Structure

```
app/integrations/
  concerns/
    integration_base.rb   # IntegrationBase.parse_json_response -- shared response parsing
  <vendor>/
    base.rb                # Faraday client: auth, base_url, headers, request()
    <resource>/
      <verb>.rb             # one class per verb per resource, inherits Base
```

Example: `Mcleod::Order::Create < Mcleod::Base`, `Samsara::Fleet::Vehicle < Samsara::Base`.

## Rules

- `Base` holds only transport concerns (auth, base_url, timeouts, headers). No business logic.
- One class per verb per resource (`Search`, `Find`, `Create`, `Update`) -- not a fat client
  with many methods.
- Every call returns a plain hash: `{ success: true, data: ... }` or `{ success: false, errors: ... }`.
  Never raise from these classes for expected API failures.
- Vendor credentials are attributes on the model that owns the relationship
  (e.g. `Carrier#tms_token`, `Carrier#mcleod_tms`), not config files or a separate
  credentials layer.
- Controllers and models call these classes directly:
  `Mcleod::Order::Create.new(carrier: carrier).create(load)`. No extra wrapper layer.
- Jobs that trigger a sync stay shallow: call the integration class, don't embed
  HTTP/parsing logic in the job (see `.claude/rules/jobs.md`).
- Top-level namespace is the vendor name (`Mcleod`, `Samsara`), not nested under the
  domain model that happens to use it (not `Load::Mcleod`).
