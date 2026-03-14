require 'test_helper'

class UserTest < Minitest::Test
  def setup
    super
    @user = build(:user)
  end

  # バリデーション
  def test_valid_user
    assert @user.valid?
  end

  def test_email_presence
    @user.email = nil
    refute @user.valid?
    assert_includes @user.errors[:email], "can't be blank"
  end

  def test_email_uniqueness
    user1 = create(:user, email: 'test@example.com')
    user2 = build(:user, email: 'TEST@example.com')
    refute user2.valid?
    assert_includes user2.errors[:email], 'has already been taken'
  end

  def test_email_format
    invalid_emails = ['invalid', 'invalid@', '@example.com', 'test@']
    invalid_emails.each do |email|
      @user.email = email
      refute @user.valid?, "#{email} should be invalid"
    end
  end

  def test_first_name_presence
    @user.first_name = nil
    refute @user.valid?
    assert_includes @user.errors[:first_name], "can't be blank"
  end

  def test_last_name_presence
    @user.last_name = nil
    refute @user.valid?
    assert_includes @user.errors[:last_name], "can't be blank"
  end

  def test_phone_presence
    @user.phone = nil
    refute @user.valid?
    assert_includes @user.errors[:phone], "can't be blank"
  end

  def test_phone_format
    @user.phone = '+1 (555) 123-4567'
    assert @user.valid?

    @user.phone = 'invalid phone'
    refute @user.valid?
  end

  # アソシエーション
  def test_has_many_addresses
    user = create(:user, :with_addresses)
    assert_equal 2, user.addresses.count
  end

  def test_has_many_orders
    user = create(:user, :with_orders)
    assert_equal 3, user.orders.count
  end

  def test_has_one_cart
    user = create(:user)
    assert_not_nil user.cart
    assert_instance_of Cart, user.cart
  end

  # インスタンスメソッド
  def test_full_name
    user = create(:user, first_name: 'John', last_name: 'Doe')
    assert_equal 'John Doe', user.full_name
  end

  def test_soft_delete
    user = create(:user)
    assert_nil user.deleted_at
    assert user.active?

    user.soft_delete
    assert_not_nil user.deleted_at
    refute user.active?
  end

  def test_generate_password_reset_token
    user = create(:user)
    user.generate_password_reset_token

    assert_not_nil user.password_reset_token
    assert_not_nil user.password_reset_expires_at
    assert user.password_reset_expires_at > Time.current
  end

  def test_password_reset_expired
    user = create(:user)
    user.password_reset_token = 'test_token'
    user.password_reset_expires_at = 2.hours.ago
    user.save

    assert user.password_reset_expired?
  end

  # コールバック
  def test_email_downcased_before_save
    user = create(:user, email: 'TEST@EXAMPLE.COM')
    assert_equal 'test@example.com', user.email
  end

  def test_cart_created_after_user_creation
    user = create(:user)
    assert_not_nil user.cart
  end

  # スコープ
  def test_active_scope
    active_user = create(:user)
    deleted_user = create(:user, :deleted)

    active_users = User.active
    assert_includes active_users, active_user
    refute_includes active_users, deleted_user
  end

  # パスワード
  def test_password_encryption
    user = create(:user, password: 'SecurePassword123')
    assert_not_equal 'SecurePassword123', user.password_digest
    assert user.authenticate('SecurePassword123')
  end
end
