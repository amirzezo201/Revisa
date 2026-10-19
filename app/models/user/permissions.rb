# frozen_string_literal: true

module User::Permissions
  extend ActiveSupport::Concern

  included do
    belongs_to :role, optional: true
    has_many :user_permissions, dependent: :destroy
    has_many :direct_permissions, through: :user_permissions, source: :permission
    has_one :ownership, dependent: :destroy

    before_destroy :prevent_destroying_owner, prepend: true
  end

  # The single system owner. Bypasses every permission check.
  def owner?
    ownership.present?
  end

  def has_permission?(name)
    owner? || permission_names.include?(name.to_s)
  end

  # Role permissions plus direct grants. The owner is sent ["*"] to the frontend.
  def permission_names
    @permission_names ||= Permission.where(id: role_permission_ids).or(Permission.where(id: user_permissions.select(:permission_id))).distinct.pluck(:name)
  end

  def reload(*)
    @permission_names = nil
    super
  end

  private
    def role_permission_ids
      RolePermission.where(role_id: role_id).select(:permission_id)
    end

    def prevent_destroying_owner
      if owner?
        errors.add(:base, "The owner cannot be deleted. Transfer ownership first.")
        throw :abort
      end
    end
end
