require 'test_helper'

class UserTest < ActiveSupport::TestCase
  def setup
    @user = build(:user)
  end

  def test_valid_user
    assert @user.valid?
  end

  def test_email_is_required
    @user.email = nil
    refute @user.valid?
    assert_includes @user.errors[:email], "can't be blank"
  end

  def test_email_must_be_unique
    create(:user, email: 'test@example.com')
    @user.email = 'TEST@example.com'
    refute @user.valid?
  end

  def test_first_name_is_required
    @user.first_name = nil
    refute @user.valid?
  end

  def test_password_authentication
    user = create(:user, password: 'SecurePassword123', password_confirmation: 'SecurePassword123')
    assert user.authenticate('SecurePassword123')
    refute user.authenticate('wrong')
  end
end
