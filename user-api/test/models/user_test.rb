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

  def test_valid_when_mx_exists
    user = build(:user, email: 'taro@example.com')
    user.stub(:email_mx_valid?, true) do
      assert user.valid?, user.errors.full_messages.to_s
    end
  end

  def test_invalid_when_mx_missing
    user = build(:user, email: 'taro@example.com')
    user.stub(:email_mx_valid?, false) do
      refute user.valid?
      assert user.errors[:email].any?
    end
  end

  def test_valid_when_lookup_fails_temporarily
    user = build(:user, email: 'taro@example.com')
    raising = ->(*) { raise Timeout::Error }
    user.stub(:email_mx_valid?, raising) do
      assert user.valid?, "ネット不調時は登録を止めない設計のはず: #{user.errors.full_messages}"
    end
  end

  def test_generate_email_confirmation_token
    assert_nil @user.email_confirmation_token
    @user.generate_email_confirmation_token
    assert @user.email_confirmation_token.present?
  end

  def test_confirm_email_marks_as_verified
    refute @user.email_verified?
    @user.confirm_email!
    assert @user.email_verified?
  end
end
