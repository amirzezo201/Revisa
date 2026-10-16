require "test_helper"

class DashboardControllerTest < ActionDispatch::IntegrationTest
  test "renders the dashboard at the root for signed in users" do
    sign_in users(:one)
    get root_path
    assert_response :success
  end

  test "redirects guests to sign in" do
    get root_path
    assert_redirected_to sign_in_path
  end
end
