require "test_helper"

class Identity::PasswordResetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "renders the forgot password page" do
    get new_identity_password_reset_path
    assert_response :success
  end

  test "sends a password reset email to a verified user" do
    assert_enqueued_email_with PasswordsMailer, :reset, args: [ @user ] do
      post identity_password_reset_path, params: { email: @user.email }
    end
    assert_redirected_to sign_in_path
  end

  test "does not send a password reset email to an unverified user" do
    @user.update!(verified: false)

    assert_no_enqueued_emails do
      post identity_password_reset_path, params: { email: @user.email }
    end
assert_redirected_to sign_in_path
    assert_equal "Password reset instructions sent (if user with that email address exists).", flash[:notice]
  end

  test "does not send a password reset email to a nonexistent email" do
    assert_no_enqueued_emails do
      post identity_password_reset_path, params: { email: "missing@example.com" }
    end
assert_redirected_to sign_in_path
    assert_equal "Password reset instructions sent (if user with that email address exists).", flash[:notice]
  end

  test "renders the reset page with a valid token" do
    sid = @user.password_reset_token
    get edit_identity_password_reset_path(sid: sid)
    assert_response :success
  end

  test "rejects an invalid reset token" do
    get edit_identity_password_reset_path(sid: "invalid")
    assert_redirected_to new_identity_password_reset_path
  end

  test "updates the password with a valid token" do
    sid = @user.password_reset_token

    patch identity_password_reset_path(sid: sid), params: {
      password: "NewPassword1*3*",
      password_confirmation: "NewPassword1*3*"
    }

    assert_redirected_to sign_in_path
  end

  test "logs out all sessions after a password reset" do
    sid = @user.password_reset_token
    @user.sessions.create!

    patch identity_password_reset_path(sid: sid), params: {
      password: "NewPassword1*3*",
      password_confirmation: "NewPassword1*3*"
    }

    assert_empty @user.sessions.reload
  end

  test "rejects the password change with an expired token" do
    sid = @user.password_reset_token

    travel 30.minutes
    patch identity_password_reset_path(sid: sid), params: {
      password: "NewPassword1*3*",
      password_confirmation: "NewPassword1*3*"
    }

    assert_redirected_to new_identity_password_reset_path
    assert_equal "That password reset link is invalid", flash[:alert]
  end

  test "rejects the password change with mismatched confirmation" do
    sid = @user.password_reset_token

    patch identity_password_reset_path(sid: sid), params: {
      password: "NewPassword1*3*",
      password_confirmation: "different"
    }

    assert_redirected_to edit_identity_password_reset_path(sid: sid)
  end
end
