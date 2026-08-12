require 'timeout'
require 'resolv'

class User < ApplicationRecord
  has_secure_password

  has_many :addresses, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_one :cart, dependent: :destroy
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, 'valid_email_2/email': true
  validate  :email_domain_receivable
  validates :first_name, :last_name, presence: true
  validates :phone, presence: true, format: { with: /\A[\d\-\(\)\+\s]{10,15}\z/, message: 'は正しい形式で入力してください（10〜15桁）' }
  
  before_save { self.email = email.downcase }
  after_create :create_cart

  scope :active, -> { where(deleted_at: nil) }

  def full_name
    "#{first_name} #{last_name}"
  end

  def soft_delete
    ActiveRecord::Base.transaction do
      deleted_email = "deleted_#{id}_#{Time.current.to_i}_#{email}"
      
      cart&.destroy
      addresses.destroy_all

      update!(
        email: deleted_email,
        deleted_at: Time.current
      )
    end
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

  def generate_email_confirmation_token
    self.email_confirmation_token = SecureRandom.urlsafe_base64
    save
  end

  def confirm_email!
    update!(email_verified_at: Time.current)
  end

  def email_verified?
    email_verified_at.present?
  end

  private


  def email_domain_receivable
    return if email.blank?

    unless email_mx_valid?
      errors.add(:email, "のドメインが正しくありません。\n受信できるメールアドレスを入力してください。")
    end
  rescue Timeout::Error, Resolv::ResolvError, SocketError => e
    Rails.logger.warn("MX確認をスキップしました: #{email} (#{e.class}: #{e.message})")
  end

  def email_mx_valid?
    return true if Rails.env.test?
    Timeout.timeout(5) do
      ValidEmail2::Address.new(email).valid_mx?
    end
  end

  def create_cart
    Cart.create(user: self)
  end
end