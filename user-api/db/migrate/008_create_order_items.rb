class CreateOrderItems < ActiveRecord::Migration[7.0]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.decimal :total, precision: 10, scale: 2
      t.json :product_snapshot
      t.timestamps
    end

    add_index :order_items, [:order_id, :product_id]
  end
end
