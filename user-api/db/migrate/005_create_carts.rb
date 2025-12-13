class CreateCarts < ActiveRecord::Migration[7.0]
  def change
    create_table :carts, if_not_exists: true do |t|
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
  end
end