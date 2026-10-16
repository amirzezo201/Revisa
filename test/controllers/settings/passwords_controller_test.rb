require "test_helper"

class Settings::PasswordsControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in users(:one)
  end

  test "renders the password settings page" do
    get settings_password_path
    assert_response :success
  end

  test "updates the password with a valid password challenge" do
    patch settings_password_path, params: {
      password: "NewPassword1*3*",
      password_confirmation: "NewPassword1*3*",
      password_challenge: "Secret1*3*5*"
    }

    assert_redirected_to settings_password_path
    assert_equal "Your password has been changed", flash[:notice]
  end

  test "does not update the password and returns inertia errors with an invalid password challenge" do
    patch settings_password_path, params: {
      password: "NewPassword1*3*",
      password_confirmation: "NewPassword1*3*",
      password_challenge: "wrongpassword"
    }

    assert_redirected_to settings_password_path
    assert_equal({ password_challenge: [ "is invalid" ] }, session[:inertia_errors])
  end
end
