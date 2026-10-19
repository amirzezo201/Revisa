require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  test "sign up is open until there is an owner" do
    Ownership.delete_all

    get sign_up_path
    assert_response :success
  end

  test "sign up is closed once there is an owner" do
    get sign_up_path
    assert_redirected_to sign_in_path

    assert_no_difference "User.count" do
      post sign_up_path, params: { name: "Sneaky", email: "sneaky@example.com", password: "Secret1*3*5*", password_confirmation: "Secret1*3*5*" }
    end
  end

  test "redirects authenticated users away from sign up" do
    sign_in users(:one)
    get sign_up_path
    assert_redirected_to root_path
  end

  test "the first sign up becomes the owner" do
    Ownership.delete_all

    assert_difference "User.count", 1 do
      post sign_up_path, params: {
        name: "New User",
        email: "new@example.com",
        password: "Secret1*3*5*",
        password_confirmation: "Secret1*3*5*"
      }
    end
    assert_redirected_to dashboard_path
    assert User.find_by!(email: "new@example.com").owner?
  end

  test "rejects an invalid user" do
    Ownership.delete_all

    assert_no_difference "User.count" do
      post sign_up_path, params: {
        name: "",
        email: "invalid",
        password: "short",
        password_confirmation: "short"
      }
    end
    assert_redirected_to sign_up_path
  end

  test "destroys current user with valid password" do
    sign_in users(:two)
    assert_difference "User.count", -1 do
      delete users_path, params: { password_challenge: "Secret1*3*5*" }
    end
    assert_redirected_to sign_in_path
  end

  test "the owner cannot delete their own account" do
    sign_in users(:one)

    assert_no_difference "User.count" do
      delete users_path, params: { password_challenge: "Secret1*3*5*" }
    end
    assert_redirected_to settings_profile_path
  end

  test "rejects account deletion with wrong password" do
    sign_in users(:one)
    assert_no_difference "User.count" do
      delete users_path, params: { password_challenge: "wrongpassword" }
    end
    assert_redirected_to settings_profile_path
  end
end
