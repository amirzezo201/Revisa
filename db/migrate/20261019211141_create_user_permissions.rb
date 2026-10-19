class CreateUserPermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :user_permissions do |t|
      t.references :user, null: false, index: false
      t.references :permission, null: false

      t.timestamps
    end
    add_index :user_permissions, %i[ user_id permission_id ], unique: true
  end
end
