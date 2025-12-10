class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users, if_not_exists: true do |t|
      # Rails用カラム
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :phone, null: false
      t.date :birth_date
      t.string :password_reset_token
      t.timestamp :password_reset_expires_at

      # Laravel管理画面用カラム
      t.string :name
      t.string :password
      t.timestamp :email_verified_at
      t.date :date_of_birth
      t.string :gender
      t.boolean :is_active, default: true
      t.timestamp :last_login_at
      t.string :remember_token, limit: 100

      t.timestamp :deleted_at
      t.timestamps
    end

    add_index :users, :email, unique: true unless index_exists?(:users, :email)
    add_index :users, :password_reset_token unless index_exists?(:users, :password_reset_token)
    add_index :users, :deleted_at unless index_exists?(:users, :deleted_at)
    add_index :users, :is_active unless index_exists?(:users, :is_active)
  end
end
