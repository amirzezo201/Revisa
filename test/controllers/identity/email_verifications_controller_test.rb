require "test_helper"

class Identity::EmailVerificationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user.update!(verified: false)
  end

  test "verifies the email with a valid token" do
    sid = @user.generate_token_for(:email_verification)

    get identity_email_verification_path(sid: sid)

    assert_redirected_to root_path
    assert @user.reload.verified?
  end

  test "does not verify the email with an expired token" do
    sid = @user.generate_token_for(:email_verification)

    travel 3.days
    get identity_email_verification_path(sid: sid)

    assert_redirected_to settings_email_path
    assert_equal "That email verification link is invalid", flash[:alert]
    assert_not @user.reload.verified?
  end

  test "redirects to settings email with an invalid token" do
    get identity_email_verification_path(sid: "invalid")
    assert_redirected_to settings_email_path
  end

  test "resends the verification email" do
    sign_in @user

    assert_enqueued_email_with UserMailer, :email_verification, params: { user: @user } do
      post identity_email_verification_path
    end
    assert_response :redirect
  end
end
