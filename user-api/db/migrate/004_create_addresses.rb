class CreateAddresses < ActiveRecord::Migration[7.0]
  def change
    create_table :addresses, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :name, null: false
      t.string :address_line_1, null: false
      t.string :address_line_2
      t.string :city, null: false
      t.string :state
      t.string :postal_code, null: false
      t.string :country, default: 'JP'
      t.string :phone
      t.boolean :is_default, default: false
      t.timestamps
    end

    add_index :addresses, [:user_id, :is_default] unless index_exists?(:addresses, [:user_id, :is_default])
  end
end
