require "test_helper"

class PasswordsMailerTest < ActionMailer::TestCase
  test "reset sends a password reset link to the user's email" do
    user = users(:one)
    mail = PasswordsMailer.reset(user)

    assert_equal [ "one@example.com" ], mail.to
    assert_equal "Reset your password", mail.subject
    assert_match "/identity/password_reset/edit?sid=", mail.body.encoded
  end
end
