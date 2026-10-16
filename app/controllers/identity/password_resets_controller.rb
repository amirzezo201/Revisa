# frozen_string_literal: true

class Identity::PasswordResetsController < InertiaController
  allow_unauthenticated_access
  before_action :set_user_by_token, only: %i[edit update]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_identity_password_reset_path, alert: "Try again later." }

  def new
  end

  def edit
    render inertia: { email: @user.email, sid: params[:sid] }
  end

  def create
    # Only verified addresses get reset links; the response is the same either way so it can't be used to probe for accounts.
    if user = User.find_by(email: params[:email], verified: true)
      PasswordsMailer.reset(user).deliver_later
    end

    redirect_to sign_in_path, notice: "Password reset instructions sent (if user with that email address exists)."
  end

  def update
    if @user.update(params.permit(:password, :password_confirmation))
      @user.sessions.destroy_all
      redirect_to sign_in_path, notice: "Your password was reset successfully. Please sign in"
    else
      redirect_to edit_identity_password_reset_path(sid: params[:sid]), inertia: { errors: @user.errors }
    end
  end

  private
    def set_user_by_token
      @user = User.find_by_password_reset_token!(params[:sid])
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      redirect_to new_identity_password_reset_path, alert: "That password reset link is invalid"
    end
end
