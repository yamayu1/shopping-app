class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :phone, null: false
      t.date :birth_date
      t.string :password_reset_token
      t.timestamp :password_reset_expires_at
      t.timestamp :deleted_at
      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :password_reset_token
    add_index :users, :deleted_at
  end
end