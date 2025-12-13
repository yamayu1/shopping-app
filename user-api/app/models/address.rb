class Address < ApplicationRecord
  belongs_to :user
  has_many :orders, dependent: :restrict_with_error

  validates :name, presence: true
  validates :postal_code, presence: true, format: { with: /\A\d{3}-\d{4}\z/ }
  validates :city, :address_line_1, presence: true
  validates :phone, presence: true, format: { with: /\A[\d\-\(\)\+\s]+\z/ }

  scope :default, -> { where(is_default: true) }

  def full_address
    [
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code
    ].compact.join(', ')
  end

  def set_as_default
    transaction do
      user.addresses.update_all(is_default: false)
      update!(is_default: true)
    end
  end
end