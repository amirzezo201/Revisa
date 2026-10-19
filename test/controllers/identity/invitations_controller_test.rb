require "test_helper"

class Identity::InvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:client)
    @token = @user.generate_token_for(:invitation)
  end

  test "shows the set-password page for a valid link" do
    get edit_identity_invitation_path(token: @token)

    assert_response :success
    assert_inertia_component "identity/invitations/edit"
    assert_equal @user.email, inertia.props[:email]
  end

  test "setting a password signs the invitee in and kills the link" do
    patch identity_invitation_path, params: { token: @token, password: "Brand*new*pass1", password_confirmation: "Brand*new*pass1" }

    assert_redirected_to dashboard_path
    assert @user.reload.authenticate("Brand*new*pass1")

    get edit_identity_invitation_path(token: @token)
    assert_redirected_to sign_in_path
  end

  test "rejects a bad link" do
    get edit_identity_invitation_path(token: "forged")
    assert_redirected_to sign_in_path
  end
end
