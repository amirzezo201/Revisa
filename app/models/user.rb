# frozen_string_literal: true

class User < ApplicationRecord
  include Permissions

  has_secure_password

  generates_token_for :email_verification, expires_in: 2.days do
    email
  end

  # Invalidated as soon as the invitee sets a password.
  generates_token_for :invitation, expires_in: 7.days do
    password_salt.last(10)
  end

  has_many :sessions, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, allow_nil: true, length: { minimum: 12 }

  normalizes :email, with: -> { _1.strip.downcase }

  before_validation if: :email_changed?, on: :update do
    self.verified = false
  end

  after_update if: :password_digest_previously_changed? do
    sessions.where.not(id: Current.session).delete_all
  end

  class << self
    # The first person to sign up owns the system. After that, sign-up is closed
    # and everyone else is invited.
    def sign_up_first_owner(attributes)
      new(attributes).tap do |user|
        transaction do
          if user.save
            Ownership.transfer_to!(user)
          end
        end
      end
    end

    # Invitees get a random password they never see; the invitation link lets
    # them choose their own.
    def invite(attributes)
      new(attributes).tap do |user|
        user.password = SecureRandom.base58(32)
        user.verified = true

        if user.save
          UserMailer.with(user: user).invitation.deliver_later
        end
      end
    end
  end
end
