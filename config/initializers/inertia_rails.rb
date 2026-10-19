# frozen_string_literal: true

InertiaRails.configure do |config|
  config.version = ViteRuby.digest
  config.encrypt_history = Rails.env.production?
  config.use_script_element_for_initial_page = true
  config.use_data_inertia_head_attribute = true
  config.always_include_errors_hash = true
  config.parent_controller = "::InertiaController"

  # Flip to true (and rebuild with --build-arg SSR_ENABLED=true) to enable SSR.
  config.ssr_enabled = true
end

# `inertia` routes (static pages like settings/appearance) have nothing to authorize.
Rails.application.config.to_prepare do
  InertiaRails::StaticController.skip_authorization_check
end
