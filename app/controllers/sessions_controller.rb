# frozen_string_literal: true

class SessionsController < InertiaController
  require_unauthenticated_access only: %i[new create]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to sign_in_path, alert: "Try again later." }

  def new
  end

  def create
    if user = User.authenticate_by(params.permit(:email, :password))
      start_new_session_for user
      redirect_to after_authentication_url, notice: "Signed in successfully"
    else
      redirect_to sign_in_path, alert: "That email or password is incorrect"
    end
  end

  # Logs out the current session, or revokes another of the user's sessions from settings.
  def destroy
    session_record = Current.user.sessions.find(params[:id])

    if session_record == Current.session
      terminate_session
      redirect_to sign_in_path, status: :see_other, inertia: { clear_history: true }
    else
      session_record.destroy!
      redirect_to settings_sessions_path, notice: "That session has been logged out"
    end
  end
end
