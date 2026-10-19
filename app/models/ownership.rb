# frozen_string_literal: true

# The single system owner. The owner bypasses every permission check and is the
# only one who manages roles and direct grants. The unique singleton_guard column
# makes a second row impossible.
class Ownership < ApplicationRecord
  belongs_to :user

  validates :user_id, uniqueness: true
  validate :only_one_owner

  class << self
    def current
      first
    end

    def owner
      current&.user
    end

    def claimable?
      none?
    end

    # The previous owner keeps working as an Admin rather than losing all access.
    def transfer_to!(user)
      transaction do
        previous = owner
        (current || new).update!(user: user)

        if previous && previous != user && previous.role.nil?
          previous.update!(role: Role.find_by(name: "Admin"))
        end
      end
    end
  end

  private
    def only_one_owner
      if Ownership.where.not(id: id).exists?
        errors.add(:base, "There is already an owner")
      end
    end
end
