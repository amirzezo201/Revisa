# frozen_string_literal: true

# Roles carry permissions, so editing one grants reach. That stops at the owner
# rather than being delegatable through a permission of its own.
class RolePolicy < ApplicationPolicy
  def index?
    user.owner?
  end

  def show?
    index?
  end

  def create?
    index?
  end

  def update?
    index?
  end

  def destroy?
    index?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.owner?
        scope.all
      else
        scope.none
      end
    end
  end
end
