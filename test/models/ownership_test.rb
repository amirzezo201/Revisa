require "test_helper"

class OwnershipTest < ActiveSupport::TestCase
  test "there is only ever one owner" do
    ownership = Ownership.new(user: users(:admin))

    assert_not ownership.valid?
    assert_includes ownership.errors[:base], "There is already an owner"
  end

  test "transfer moves ownership and keeps the previous owner working as Admin" do
    Ownership.transfer_to!(users(:seo))

    assert_equal users(:seo), Ownership.owner
    assert users(:seo).reload.owner?
    assert_not users(:one).reload.owner?
    assert_equal roles(:admin), users(:one).role
    assert_equal 1, Ownership.count
  end

  test "claimable only while nobody owns the system" do
    assert_not Ownership.claimable?

    Ownership.delete_all
    assert Ownership.claimable?
  end
end
