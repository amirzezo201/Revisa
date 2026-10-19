# frozen_string_literal: true

class Admin::UserResource < ApplicationResource
  attributes :id, :name, :email, :role_id, :created_at

  attribute :role_name do |user|
    user.role&.name
  end

  attribute :is_owner, &:owner?

  # Invited but never signed in.
  attribute :pending do |user|
    user.sessions.none?
  end
end
