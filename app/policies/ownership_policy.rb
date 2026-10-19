# frozen_string_literal: true

class OwnershipPolicy < ApplicationPolicy
  def show?
    user.owner?
  end

  def update?
    user.owner?
  end
end
