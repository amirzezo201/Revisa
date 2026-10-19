require "test_helper"

class RoleTest < ActiveSupport::TestCase
  test "apply_template sets the template's permissions and description" do
    role = Role.new(name: "Proofreader").apply_template(:writer)

    assert_equal Role::Templates::WRITER.sort, role.permissions.map(&:name).sort
    assert_equal Role.template!(:writer).description, role.description
  end

  test "apply_template rejects unknown templates" do
    assert_raises(ArgumentError) { Role.new.apply_template(:pirate) }
  end

  test "copy_permissions_from copies another role" do
    role = Role.new(name: "SEO copy").copy_permissions_from(roles(:seo))

    assert_equal roles(:seo).permissions.sort, role.permissions.sort
  end

  test "seed resyncs Admin but leaves curated roles alone" do
    roles(:admin).permissions.delete(permissions(:users_destroy))
    roles(:writer).update!(permissions: [ permissions(:pages_show) ])

    Role.seed

    assert_includes roles(:admin).reload.permissions, permissions(:users_destroy)
    assert_equal [ permissions(:pages_show) ], roles(:writer).reload.permissions.to_a
  end

  test "a role with people on it cannot be deleted" do
    assert_not roles(:writer).destroy
    assert_includes roles(:writer).errors.full_messages.to_sentence, "users"
  end
end
