require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_many(:addresses).dependent(:destroy) }
    it { should have_many(:orders).dependent(:destroy) }
    it { should have_one(:cart).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:first_name) }
    it { should validate_presence_of(:last_name) }
    it { should validate_presence_of(:phone) }
    it { should have_secure_password }
  end

  describe 'email validation' do
    it 'validates email format' do
      user = build(:user, email: 'invalid-email')
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('is invalid')
    end

    it 'accepts valid email' do
      user = build(:user, email: 'valid@example.com')
      expect(user).to be_valid
    end
  end

  describe 'phone validation' do
    it 'validates phone format' do
      user = build(:user, phone: 'abc-def-ghij')
      expect(user).not_to be_valid
    end

    it 'accepts valid phone numbers' do
      ['090-1234-5678', '+81-90-1234-5678', '09012345678'].each do |phone|
        user = build(:user, phone: phone)
        expect(user).to be_valid
      end
    end
  end

  describe 'callbacks' do
    it 'downcases email before save' do
      user = create(:user, email: 'TEST@EXAMPLE.COM')
      expect(user.email).to eq('test@example.com')
    end

    it 'creates cart after user creation' do
      user = create(:user)
      expect(user.cart).to be_present
    end
  end

  describe '#full_name' do
    it 'returns first name and last name' do
      user = build(:user, first_name: 'John', last_name: 'Doe')
      expect(user.full_name).to eq('John Doe')
    end
  end

  describe '#active?' do
    it 'returns true for users without deleted_at' do
      user = create(:user)
      expect(user.active?).to be true
    end

    it 'returns false for soft deleted users' do
      user = create(:user)
      user.soft_delete
      expect(user.active?).to be false
    end
  end

  describe '#soft_delete' do
    it 'sets deleted_at timestamp' do
      user = create(:user)
      expect { user.soft_delete }.to change { user.deleted_at }.from(nil)
    end
  end

  describe '#generate_password_reset_token' do
    it 'generates password reset token and expiry' do
      user = create(:user)
      user.generate_password_reset_token
      
      expect(user.password_reset_token).to be_present
      expect(user.password_reset_expires_at).to be_present
      expect(user.password_reset_expires_at).to be > Time.current
    end
  end

  describe '#password_reset_expired?' do
    it 'returns true for expired tokens' do
      user = create(:user)
      user.update(password_reset_expires_at: 1.hour.ago)
      expect(user.password_reset_expired?).to be true
    end

    it 'returns false for valid tokens' do
      user = create(:user)
      user.update(password_reset_expires_at: 1.hour.from_now)
      expect(user.password_reset_expired?).to be false
    end
  end

  describe 'scopes' do
    describe '.active' do
      it 'returns only users without deleted_at' do
        active_user = create(:user)
        deleted_user = create(:user)
        deleted_user.soft_delete

        expect(User.active).to include(active_user)
        expect(User.active).not_to include(deleted_user)
      end
    end
  end
end