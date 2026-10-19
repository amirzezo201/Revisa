require "test_helper"

class Settings::AppearanceTest < ActionDispatch::IntegrationTest
  test "the static appearance page renders without an authorization check" do
    sign_in users(:client)
    get settings_appearance_path

    assert_response :success
    assert_inertia_component "settings/appearance"
  end
end
