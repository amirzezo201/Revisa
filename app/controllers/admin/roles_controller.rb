# frozen_string_literal: true

class Admin::RolesController < InertiaController
  before_action :set_role, only: %i[ edit update destroy ]

  def index
    authorize Role
    roles = policy_scope(Role).includes(:permissions, :users).order(:name)

    render inertia: { roles: Admin::RoleResource.new(roles).to_h }
  end

  def new
    authorize Role

    render inertia: {
      templates: Role.templates.map { |template| template.to_h.slice(:key, :name, :description).merge(permissions_count: template.permissions_count) },
      roles: Role.order(:name).map { |role| role.slice(:id, :name) }
    }
  end

  def create
    @role = Role.new(role_params)
    authorize @role
    start_from_template_or_copy

    if @role.save
      redirect_to edit_admin_role_path(@role), notice: "Role created. Review its permissions below."
    else
      redirect_to new_admin_role_path, inertia: { errors: @role.errors }
    end
  end

  def edit
    render inertia: {
      role: Admin::RoleResource.new(@role).to_h.merge(permission_ids: @role.permission_ids),
      permissions: Permission.catalogue
    }
  end

  def update
    if @role.update(role_params)
      redirect_to admin_roles_path, notice: "Role updated"
    else
      redirect_to edit_admin_role_path(@role), inertia: { errors: @role.errors }
    end
  end

  def destroy
    if @role.destroy
      redirect_to admin_roles_path, notice: "Role deleted"
    else
      redirect_to admin_roles_path, alert: @role.errors.full_messages.to_sentence
    end
  end

  private
    def set_role
      @role = authorize policy_scope(Role).find(params[:id])
    end

    def role_params
      params.expect(role: [ :name, :description, permission_ids: [] ])
    end

    def start_from_template_or_copy
      start = params.fetch(:role, {}).permit(:template, :copy_from_role_id)

      if start[:template].present?
        @role.apply_template(start[:template])
      elsif start[:copy_from_role_id].present?
        @role.copy_permissions_from(Role.find(start[:copy_from_role_id]))
      end
    end
end
