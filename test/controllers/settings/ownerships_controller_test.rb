require "test_helper"

class Settings::OwnershipsControllerTest < ActionDispatch::IntegrationTest
  test "the owner hands over ownership" do
    sign_in users(:one)
    get settings_ownership_path
    assert_response :success

    patch settings_ownership_path, params: { user_id: users(:seo).id }

    assert_redirected_to dashboard_path
    assert users(:seo).reload.owner?
    assert_equal roles(:admin), users(:one).reload.role
  end

  test "nobody else can take it" do
    sign_in users(:admin)

    patch settings_ownership_path, params: { user_id: users(:admin).id }

    assert_redirected_to root_path
    assert users(:one).reload.owner?
  end
end
