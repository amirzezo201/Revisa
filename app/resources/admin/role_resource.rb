# frozen_string_literal: true

class Admin::RoleResource < ApplicationResource
  attributes :id, :name, :description

  attribute :permissions_count do |role|
    role.permissions.size
  end

  attribute :users_count do |role|
    role.users.size
  end
end
