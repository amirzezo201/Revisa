# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  # Editing someone else needs users.update, and nobody but the owner may touch the owner.
  def update?
    has_permission?(permission(:update)) && (!record.owner? || record == user)
  end

  def destroy?
    has_permission?(permission(:destroy)) && record != user && !record.owner?
  end

  def assign_role?
    has_permission?(permission(:assign_role)) && !record.owner?
  end

  def manage_permissions?
    user.owner? && !record.owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if has_permission?(permission(:index))
        scope.includes(:role, :ownership).order(:name)
      else
        scope.none
      end
    end
  end
end
