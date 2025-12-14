class CreateOrders < ActiveRecord::Migration[7.0]
  def change
    create_table :orders, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: true
      t.references :address, null: false, foreign_key: true
      t.string :order_number, null: false
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.string :status, default: 'pending'
      t.string :payment_status, default: 'pending'
      t.string :payment_method
      t.string :payment_transaction_id
      t.text :notes

      # Laravel管理画面用カラム
      t.decimal :subtotal, precision: 10, scale: 2
      t.decimal :tax_amount, precision: 10, scale: 2, default: 0
      t.decimal :shipping_amount, precision: 10, scale: 2, default: 0
      t.decimal :discount_amount, precision: 10, scale: 2, default: 0
      t.json :shipping_address
      t.json :billing_address
      t.string :payment_reference
      t.string :tracking_number
      t.timestamp :shipped_at
      t.timestamp :delivered_at
      t.timestamp :deleted_at

      t.timestamps
    end

    add_index :orders, :order_number, unique: true unless index_exists?(:orders, :order_number)
    add_index :orders, :status unless index_exists?(:orders, :status)
    add_index :orders, :payment_status unless index_exists?(:orders, :payment_status)
    add_index :orders, :created_at unless index_exists?(:orders, :created_at)
    add_index :orders, [:user_id, :status] unless index_exists?(:orders, [:user_id, :status])
    add_index :orders, [:status, :created_at] unless index_exists?(:orders, [:status, :created_at])
  end
end
