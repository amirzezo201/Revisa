# frozen_string_literal: true

class Settings::OwnershipsController < InertiaController
  before_action :set_ownership

  def show
    render inertia: { candidates: User.where.not(id: Current.user).order(:name).map { |user| user.slice(:id, :name, :email) } }
  end

  def update
    new_owner = User.where.not(id: Current.user).find(params.expect(:user_id))
    Ownership.transfer_to!(new_owner)

    redirect_to dashboard_path, notice: "#{new_owner.name} is now the owner"
  end

  private
    def set_ownership
      @ownership = authorize Ownership.current || Ownership.new
    end
end
