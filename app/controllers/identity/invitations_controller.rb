# frozen_string_literal: true

# An invited user follows the emailed link and chooses a password. The token
# dies as soon as the password changes, so the link works once.
class Identity::InvitationsController < InertiaController
  skip_authorization_check
  allow_unauthenticated_access
  before_action :set_user_by_token

  def edit
    render inertia: { token: params[:token], name: @user.name, email: @user.email }
  end

  def update
    if @user.update(params.permit(:password, :password_confirmation))
      start_new_session_for @user
      redirect_to dashboard_path, notice: "Welcome to Revisa, #{@user.name}"
    else
      redirect_to edit_identity_invitation_path(token: params[:token]), inertia: { errors: @user.errors }
    end
  end

  private
    def set_user_by_token
      @user = User.find_by_token_for(:invitation, params[:token])

      if @user.nil?
        redirect_to sign_in_path, alert: "That invitation link is invalid or has expired. Ask the owner to resend it."
      end
    end
end
