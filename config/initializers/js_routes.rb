# frozen_string_literal: true

JsRoutes.setup do |c|
  c.module_type = "ESM"
  c.file = Rails.root.join("app/frontend/routes.js")

  # Follow JavaScript naming convention: `sign_in_path` => `signInPath`
  c.camel_case = true

  c.exclude = [ /^rails_/, /^turbo_/ ]

  # Omit query parameters whose value is undefined.
  c.include_undefined_query_parameters = false
end
