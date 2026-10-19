# frozen_string_literal: true

class Admin::UsersController < InertiaController
  before_action :set_user, only: %i[ edit update destroy ]

  def index
    authorize User
    users = policy_scope(User).includes(:sessions)

    render inertia: {
      users: Admin::UserResource.new(users).to_h,
      can_invite: policy(User).create?
    }
  end

  def new
    authorize User

    render inertia: { roles: role_options }
  end

  def create
    authorize User
    @user = User.invite(invite_params)

    if @user.persisted?
      redirect_to admin_users_path, notice: "Invitation sent to #{@user.email}"
    else
      redirect_to new_admin_user_path, inertia: { errors: @user.errors }
    end
  end

  def edit
    render inertia: {
      user: Admin::UserResource.new(@user).to_h.merge(direct_permission_ids: @user.direct_permission_ids),
      roles: role_options,
      role_permission_ids: RolePermission.pluck(:role_id, :permission_id).group_by(&:first).transform_values { it.map(&:last) },
      can_assign_role: policy(@user).assign_role?,
      can_manage_permissions: policy(@user).manage_permissions?,
      permissions: policy(@user).manage_permissions? ? Permission.catalogue : {}
    }
  end

  def update
    if @user.update(update_params)
      redirect_to admin_users_path, notice: "#{@user.name} updated"
    else
      redirect_to edit_admin_user_path(@user), inertia: { errors: @user.errors }
    end
  end

  def destroy
    if @user.destroy
      redirect_to admin_users_path, notice: "#{@user.name} removed"
    else
      redirect_to admin_users_path, alert: @user.errors.full_messages.to_sentence
    end
  end

  private
    def set_user
      @user = authorize policy_scope(User).find(params[:id])
    end

    def role_options
      Role.order(:name).map { |role| role.slice(:id, :name, :description) }
    end

    def invite_params
      params.expect(user: [ :name, :email, :role_id ]).tap do |attributes|
        attributes.delete(:role_id) unless policy(User.new).assign_role?
      end
    end

    # Role and direct grants are dropped silently unless the editor may change them.
    def update_params
      params.expect(user: [ :name, :email, :role_id, direct_permission_ids: [] ]).tap do |attributes|
        attributes.delete(:role_id) unless policy(@user).assign_role?
        attributes.delete(:direct_permission_ids) unless policy(@user).manage_permissions?
      end
    end
end
