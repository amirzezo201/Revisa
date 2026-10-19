# frozen_string_literal: true

# Pundit, wired to Current.user. Every action must call `authorize` (and index
# actions `policy_scope`); a forgotten check fails loudly in development and tests
# instead of quietly allowing access. Controllers with nothing to authorize
# (sign in, own settings) opt out with `skip_authorization_check`.
module Authorization
  extend ActiveSupport::Concern
  include Pundit::Authorization

  included do
    after_action :verify_authorized
    after_action :verify_policy_scoped, if: -> { action_name == "index" }
    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  end

  class_methods do
    def skip_authorization_check(**options)
      skip_after_action :verify_authorized, **options
      skip_after_action :verify_policy_scoped, **options
    end
  end

  private
    def pundit_user
      Current.user
    end

    def user_not_authorized
      redirect_back_or_to root_path, alert: "You don't have permission to do that."
    end
end
