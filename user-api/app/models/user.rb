class User < ApplicationRecord
  has_secure_password

  has_many :addresses, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_one :cart, dependent: :destroy
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP } # validate email format
  validates :first_name, :last_name, presence: true
  validates :phone, presence: true, format: { with: /\A[\d\-\(\)\+\s]{10,15}\z/, message: 'は正しい形式で入力してください（10〜15桁）' }
  
  before_save { self.email = email.downcase }
  after_create :create_cart

  scope :active, -> { where(deleted_at: nil) }

  def full_name
    "#{first_name} #{last_name}"
  end

  def soft_delete
    update(deleted_at: Time.current)
  end

  def active?
    deleted_at.nil?
  end

  def generate_password_reset_token
    self.password_reset_token = SecureRandom.urlsafe_base64
    self.password_reset_expires_at = 1.hour.from_now
    save
  end

  def password_reset_expired?
    password_reset_expires_at < Time.current
  end

  private

  def create_cart
    Cart.create(user: self)
  end
end