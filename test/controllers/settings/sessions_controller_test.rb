require "test_helper"

class Settings::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in users(:one)
  end

  test "renders the sessions index" do
    get settings_sessions_path
    assert_response :success
  end
end
