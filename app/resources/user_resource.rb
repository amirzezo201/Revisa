# frozen_string_literal: true

class UserResource < ApplicationResource
  attributes :id, :name, :email, :verified, :created_at, :updated_at
end
