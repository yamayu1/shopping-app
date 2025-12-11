class CreateCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :categories, if_not_exists: true do |t|
      # Rails用カラム
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.boolean :active, default: true

      # Laravel管理画面用カラム
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

    # テーブルがLaravel側で先に作られた場合、不足カラムを追加
    unless column_exists?(:categories, :active)
      add_column :categories, :active, :boolean, default: true
    end
    unless column_exists?(:categories, :slug)
      add_column :categories, :slug, :string, null: false, default: ''
    end

    add_index :categories, :name unless index_exists?(:categories, :name)
    add_index :categories, :slug, unique: true unless index_exists?(:categories, :slug)
    add_index :categories, :active unless index_exists?(:categories, :active)
    add_index :categories, :is_active unless index_exists?(:categories, :is_active)
    add_index :categories, :is_featured unless index_exists?(:categories, :is_featured)
    add_index :categories, :sort_order unless index_exists?(:categories, :sort_order)
    add_index :categories, [:slug, :is_active] unless index_exists?(:categories, [:slug, :is_active])
  end
end
