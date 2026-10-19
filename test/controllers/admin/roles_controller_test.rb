require "test_helper"

class Admin::RolesControllerTest < ActionDispatch::IntegrationTest
  setup { sign_in users(:one) }

  test "lists roles for the owner" do
    get admin_roles_path

    assert_response :success
    assert_inertia_component "admin/roles/index"
    assert_equal Role.count, inertia.props[:roles].size
  end

  test "creates a role from a template" do
    assert_difference "Role.count" do
      post admin_roles_path, params: { role: { name: "Freelancer", template: "writer" } }
    end

    role = Role.find_by!(name: "Freelancer")
    assert_redirected_to edit_admin_role_path(role)
    assert_equal Role::Templates::WRITER.sort, role.permissions.map(&:name).sort
  end

  test "creates a role as a copy of another" do
    post admin_roles_path, params: { role: { name: "SEO junior", copy_from_role_id: roles(:seo).id } }

    assert_equal roles(:seo).permissions.sort, Role.find_by!(name: "SEO junior").permissions.sort
  end

  test "updates a role's permissions, including clearing them" do
    patch admin_role_path(roles(:client_reviewer)), params: { role: { name: "Client", permission_ids: [ permissions(:pages_show).id ] } }
    assert_redirected_to admin_roles_path
    assert_equal [ permissions(:pages_show) ], roles(:client_reviewer).reload.permissions.to_a

    patch admin_role_path(roles(:client_reviewer)), params: { role: { name: "Client", permission_ids: [ "" ] } }
    assert_empty roles(:client_reviewer).reload.permissions
  end

  test "will not delete a role people still have" do
    assert_no_difference "Role.count" do
      delete admin_role_path(roles(:writer))
    end
    assert_redirected_to admin_roles_path
  end

  test "an Admin cannot manage roles" do
    sign_in users(:admin)

    get admin_roles_path
    assert_redirected_to root_path

    patch admin_role_path(roles(:writer)), params: { role: { permission_ids: Permission.ids } }
    assert_not_equal Permission.count, roles(:writer).reload.permissions.count
  end
end
