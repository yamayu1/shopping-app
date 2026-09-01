class AddEmailConfirmationTokenToUsers < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:users, :email_confirmation_token)
      add_column :users, :email_confirmation_token, :string
    end
    unless index_exists?(:users, :email_confirmation_token)
      add_index :users, :email_confirmation_token
    end
  end
end
