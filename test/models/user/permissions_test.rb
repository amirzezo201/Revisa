require "test_helper"

class User::PermissionsTest < ActiveSupport::TestCase
  include ActionMailer::TestHelper

  test "the owner has every permission, even ones that don't exist yet" do
    assert users(:one).owner?
    assert users(:one).has_permission?("reviews.approve")
    assert users(:one).has_permission?("anything.at_all")
  end

  test "permissions come from the role" do
    assert users(:seo).has_permission?("reviews.approve")
    assert_not users(:two).has_permission?("reviews.approve")
    assert users(:two).has_permission?("drafts.update_own")
  end

  test "direct grants add to the role" do
    writer = users(:two)
    writer.direct_permissions << permissions(:reviews_approve)

    assert writer.reload.has_permission?("reviews.approve")
  end

  test "a user without a role has no permissions" do
    assert_empty users(:no_role).permission_names
    assert_not users(:no_role).has_permission?("pages.index")
  end

  test "the owner cannot be deleted" do
    assert_not users(:one).destroy
    assert_includes users(:one).errors[:base], "The owner cannot be deleted. Transfer ownership first."
  end

  test "sign_up_first_owner makes the new user the owner" do
    Ownership.delete_all

    user = User.sign_up_first_owner(name: "First", email: "first@example.com", password: "Secret1*3*5*")

    assert user.persisted?
    assert user.owner?
  end

  test "invite creates a user with an unusable password and emails them" do
    assert_enqueued_emails 1 do
      user = User.invite(name: "New Writer", email: "writer@example.com", role_id: roles(:writer).id)

      assert user.persisted?
      assert_equal roles(:writer), user.role
    end
  end

  test "the invitation token dies once a password is set" do
    user = users(:two)
    token = user.generate_token_for(:invitation)
    assert_equal user, User.find_by_token_for(:invitation, token)

    user.update!(password: "Brand*new*pass1")
    assert_nil User.find_by_token_for(:invitation, token)
  end
end
