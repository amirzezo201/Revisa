# frozen_string_literal: true

class UsersController < InertiaController
  skip_authorization_check
  require_unauthenticated_access only: %i[new create]
  before_action :require_open_sign_up, only: %i[new create]

  def new
    @user = User.new
  end

  def create
    @user = User.sign_up_first_owner(user_params)

    if @user.persisted?
      start_new_session_for @user

      send_email_verification
      redirect_to dashboard_path, notice: "Welcome! You have signed up successfully"
    else
      redirect_to sign_up_path, inertia: { errors: @user.errors }
    end
  end

  def destroy
    user = Current.user
    if !user.authenticate(params[:password_challenge] || "")
      redirect_to settings_profile_path, inertia: { errors: { password_challenge: "Password challenge is invalid" } }
    elsif user.destroy
      cookies.delete(:session_id)
      redirect_to sign_in_path, notice: "Your account has been deleted", inertia: { clear_history: true }
    else
      redirect_to settings_profile_path, alert: user.errors.full_messages.to_sentence
    end
  end

  private

  # Only the first account can sign up; it becomes the owner. Everyone after is invited.
  def require_open_sign_up
    unless Ownership.claimable?
      redirect_to sign_in_path, alert: "Sign-up is closed. Ask the owner for an invitation."
    end
  end

  def user_params
    params.permit(:email, :name, :password, :password_confirmation)
  end

  def send_email_verification
    UserMailer.with(user: @user).email_verification.deliver_later
  end
end
