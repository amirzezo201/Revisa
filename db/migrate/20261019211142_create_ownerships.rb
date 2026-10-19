# A single row: the unique singleton_guard (always 0) makes a second owner impossible at the database level.
class CreateOwnerships < ActiveRecord::Migration[8.1]
  def change
    create_table :ownerships do |t|
      t.references :user, null: false, index: { unique: true }
      t.integer :singleton_guard, null: false, default: 0

      t.timestamps
    end
    add_index :ownerships, :singleton_guard, unique: true
  end
end
