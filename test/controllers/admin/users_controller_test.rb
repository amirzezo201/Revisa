require "test_helper"

class Admin::UsersControllerTest < ActionDispatch::IntegrationTest
  test "an admin sees everyone" do
    sign_in users(:admin)
    get admin_users_path

    assert_response :success
    assert_inertia_component "admin/users/index"
    assert_equal User.count, inertia.props[:users].size
  end

  test "writers and clients are turned away" do
    [ users(:two), users(:client) ].each do |user|
      sign_in user
      get admin_users_path
      assert_redirected_to root_path
    end
  end

  test "inviting someone creates them with a role and sends the invitation" do
    sign_in users(:admin)

    assert_enqueued_emails 1 do
      post admin_users_path, params: { user: { name: "Nina", email: "nina@acme.example", role_id: roles(:client_reviewer).id } }
    end

    assert_redirected_to admin_users_path
    assert_equal roles(:client_reviewer), User.find_by!(email: "nina@acme.example").role
  end

  test "an invalid invitation goes back with errors" do
    sign_in users(:admin)

    assert_no_difference "User.count" do
      post admin_users_path, params: { user: { name: "", email: "nope" } }
    end
    assert_redirected_to new_admin_user_path
  end

  test "only the owner can grant direct permissions" do
    sign_in users(:admin)
    patch admin_user_path(users(:two)), params: { user: { name: "Renamed", direct_permission_ids: [ permissions(:reviews_approve).id ] } }

    assert_equal "Renamed", users(:two).reload.name
    assert_empty users(:two).direct_permissions

    sign_in users(:one)
    patch admin_user_path(users(:two)), params: { user: { name: "Renamed", direct_permission_ids: [ permissions(:reviews_approve).id ] } }
    assert_equal [ permissions(:reviews_approve) ], users(:two).reload.direct_permissions.to_a
  end

  test "the edit page sends the catalogue only to the owner" do
    sign_in users(:admin)
    get edit_admin_user_path(users(:two))
    assert_equal({}, inertia.props[:permissions])
    assert_equal false, inertia.props[:can_manage_permissions]

    sign_in users(:one)
    get edit_admin_user_path(users(:two))
    assert_equal Permission::CATALOGUE.keys.sort, inertia.props[:permissions].keys.map(&:to_s).sort
  end

  test "an admin cannot edit or remove the owner" do
    sign_in users(:admin)

    patch admin_user_path(users(:one)), params: { user: { name: "Hijacked" } }
    assert_not_equal "Hijacked", users(:one).reload.name

    assert_no_difference "User.count" do
      delete admin_user_path(users(:one))
    end
  end

  test "removing someone" do
    sign_in users(:admin)

    assert_difference "User.count", -1 do
      delete admin_user_path(users(:client))
    end
    assert_redirected_to admin_users_path
  end

  test "resending an invitation" do
    sign_in users(:admin)

    assert_enqueued_emails 1 do
      post admin_user_invitation_path(users(:client))
    end
    assert_redirected_to admin_users_path
  end
end
