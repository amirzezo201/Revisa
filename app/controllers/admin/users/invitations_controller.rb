# frozen_string_literal: true

# Resends the invitation email, for invitees whose link expired or got lost.
class Admin::Users::InvitationsController < InertiaController
  def create
    user = authorize policy_scope(User).find(params[:user_id]), :create?
    UserMailer.with(user: user).invitation.deliver_later

    redirect_to admin_users_path, notice: "Invitation resent to #{user.email}"
  end
end
