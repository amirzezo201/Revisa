# Nullable: the owner needs no role, and a user without one simply has no permissions.
class AddRoleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :role
  end
end
