class CreateCartItems < ActiveRecord::Migration[7.0]
  def change
    create_table :cart_items, if_not_exists: true do |t|
      t.references :cart, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.timestamps
    end

    add_index :cart_items, [:cart_id, :product_id], unique: true unless index_exists?(:cart_items, [:cart_id, :product_id])
  end
end