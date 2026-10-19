require "test_helper"

class UserPolicyTest < ActiveSupport::TestCase
  test "admins manage people but nobody but the owner touches the owner" do
    policy = UserPolicy.new(users(:admin), users(:two))
    assert policy.update?
    assert policy.destroy?
    assert policy.assign_role?

    on_owner = UserPolicy.new(users(:admin), users(:one))
    assert_not on_owner.update?
    assert_not on_owner.destroy?
    assert_not on_owner.assign_role?
  end

  test "only the owner grants direct permissions" do
    assert UserPolicy.new(users(:one), users(:two)).manage_permissions?
    assert_not UserPolicy.new(users(:admin), users(:two)).manage_permissions?
    assert_not UserPolicy.new(users(:one), users(:one)).manage_permissions?
  end

  test "nobody deletes themselves from the admin screen" do
    assert_not UserPolicy.new(users(:admin), users(:admin)).destroy?
  end

  test "writers and clients cannot see the people list" do
    assert_empty UserPolicy::Scope.new(users(:two), User).resolve
    assert_empty UserPolicy::Scope.new(users(:client), User).resolve
    assert_not UserPolicy.new(users(:client), User).index?
  end
end
