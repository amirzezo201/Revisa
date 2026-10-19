require "test_helper"

class RolePolicyTest < ActiveSupport::TestCase
  test "only the owner manages roles, not even an Admin" do
    assert RolePolicy.new(users(:one), Role).index?
    assert RolePolicy.new(users(:one), roles(:writer)).update?

    assert_not RolePolicy.new(users(:admin), Role).index?
    assert_not RolePolicy.new(users(:admin), roles(:writer)).update?
    assert_empty RolePolicy::Scope.new(users(:admin), Role).resolve
  end
end
