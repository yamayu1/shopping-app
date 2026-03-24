class CreateCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :categories do |t|
      # Rails用カラム
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.boolean :active, default: true

      # Laravel管理画面用カラム
      t.bigint :parent_id
      t.string :image
      t.string :icon
      t.integer :sort_order, default: 0
      t.boolean :is_active, default: true
      t.boolean :is_featured, default: false
      t.string :meta_title
      t.text :meta_description
      t.json :custom_attributes

      t.timestamp :deleted_at
      t.timestamps
    end

    add_index :categories, :name
    add_index :categories, :slug, unique: true
    add_index :categories, :active
    add_index :categories, :is_active
    add_index :categories, :is_featured
    add_index :categories, :sort_order
    add_index :categories, [:parent_id, :sort_order]
    add_index :categories, [:slug, :is_active]
    add_foreign_key :categories, :categories, column: :parent_id, on_delete: :cascade, validate: false
  end
end
