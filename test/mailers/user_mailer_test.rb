require "test_helper"

class UserMailerTest < ActionMailer::TestCase
  test "email_verification sends to the user's email with the correct subject" do
    mail = UserMailer.with(user: users(:one)).email_verification

    assert_equal [ "one@example.com" ], mail.to
    assert_equal "Verify your email", mail.subject
  end
end
