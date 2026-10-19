class CreateRolePermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :role_permissions do |t|
      t.references :role, null: false, index: false
      t.references :permission, null: false

      t.timestamps
    end
    add_index :role_permissions, %i[ role_id permission_id ], unique: true
  end
end
