class CreateProducts < ActiveRecord::Migration[7.0]
  def change
    create_table :products do |t|
      # Rails用カラム
      t.string :name, null: false
      t.text :description
      t.string :sku, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :stock_quantity, default: 0
      t.references :category, null: false, foreign_key: true
      t.integer :status, default: 0

      # Laravel管理画面用カラム
      t.text :short_description
      t.decimal :sale_price, precision: 10, scale: 2
      t.decimal :cost_price, precision: 10, scale: 2
      t.integer :low_stock_threshold, default: 10
      t.string :brand
      t.decimal :weight, precision: 8, scale: 2
      t.json :dimensions
      t.string :color, limit: 100
      t.string :size, limit: 100
      t.string :material
      t.boolean :is_active, default: true
      t.boolean :is_featured, default: false
      t.string :meta_title
      t.text :meta_description
      t.json :tags
      t.json :images
      t.json :custom_attributes

      t.timestamp :deleted_at
      t.timestamps
    end

    add_index :products, :sku, unique: true
    add_index :products, :name
    add_index :products, :status
    add_index :products, :stock_quantity
    add_index :products, :is_active
    add_index :products, :is_featured
    add_index :products, :price
    add_index :products, :brand
    add_index :products, [:sku, :is_active]
    add_index :products, [:category_id, :is_active]
    add_index :products, [:is_active, :is_featured]
  end
end
