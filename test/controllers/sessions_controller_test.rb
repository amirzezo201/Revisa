require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "renders the sign in page" do
    get sign_in_path
    assert_response :success
  end

  test "redirects authenticated users away from sign in" do
    sign_in users(:one)
    get sign_in_path
    assert_redirected_to root_path
  end

  test "signs in with valid credentials and sets a session cookie" do
    post sign_in_path, params: { email: users(:one).email, password: "Secret1*3*5*" }
    assert_redirected_to root_url
    assert cookies[:session_id].present?

    get dashboard_path
    assert_response :success
  end

  test "returns to the originally requested page after signing in" do
    get settings_profile_path
    assert_redirected_to sign_in_path

    post sign_in_path, params: { email: users(:one).email, password: "Secret1*3*5*" }
    assert_redirected_to settings_profile_url
  end

  test "redirects back with an alert on invalid credentials" do
    post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
    assert_redirected_to sign_in_path
    assert_equal "That email or password is incorrect", flash[:alert]

    get dashboard_path
    assert_redirected_to sign_in_path
  end

  test "logs out the current session" do
    sign_in users(:one)
    session_record = users(:one).sessions.last

    delete session_path(session_record)

    assert_redirected_to sign_in_path
    assert_not Session.exists?(session_record.id)
  end

  test "revokes another of the user's sessions" do
    sign_in users(:one)
    other_session = users(:one).sessions.create!

    delete session_path(other_session)

    assert_redirected_to settings_sessions_path
    assert_not Session.exists?(other_session.id)
  end

  test "cannot revoke another user's session" do
    sign_in users(:one)
    other_session = users(:two).sessions.create!

    delete session_path(other_session)

    assert_response :not_found
    assert Session.exists?(other_session.id)
  end
end
