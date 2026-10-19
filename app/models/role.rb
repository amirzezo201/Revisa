# frozen_string_literal: true

class Role < ApplicationRecord
  include Templates

  has_many :users, dependent: :restrict_with_error
  has_many :role_permissions, dependent: :destroy
  has_many :permissions, through: :role_permissions

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  normalizes :name, with: -> { it.strip }
end
