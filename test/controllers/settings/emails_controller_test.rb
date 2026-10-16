require "test_helper"

class Settings::EmailsControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in users(:one)
  end

  test "renders the email settings page" do
    get settings_email_path
    assert_response :success
  end

  test "updates the email with a valid password challenge" do
    patch settings_email_path, params: {
      email: "updated@example.com",
      password_challenge: "Secret1*3*5*"
    }

    assert_redirected_to settings_email_path
    assert_equal "Your email has been changed", flash[:notice]
    assert_equal "updated@example.com", users(:one).reload.email
  end

  test "does not update the email and returns inertia errors with an invalid password challenge" do
    patch settings_email_path, params: {
      email: "updated@example.com",
      password_challenge: "wrongpassword"
    }

    assert_redirected_to settings_email_path
    assert_equal({ password_challenge: [ "is invalid" ] }, session[:inertia_errors])
    assert_equal "one@example.com", users(:one).reload.email
  end
end
