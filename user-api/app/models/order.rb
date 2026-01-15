class Order < ApplicationRecord
  belongs_to :user
  belongs_to :address
  has_many :order_items, dependent: :destroy

  validates :order_number, presence: true, uniqueness: true
  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true

  enum status: { 
    pending: 0, 
    confirmed: 1, 
    processing: 2, 
    shipped: 3, 
    delivered: 4, 
    cancelled: 5,
    refunded: 6
  }

  enum payment_status: {
    unpaid: 0,
    paid: 1,
    failed: 2,
    refunded: 3
  }

  before_validation :generate_order_number, on: :create
  after_create :create_order_items_from_cart

  scope :recent, -> { order(created_at: :desc) }

  def can_cancel?
    pending? || confirmed?
  end

  def cancel!
    return false unless can_cancel?

    transaction do
      # 在庫数を復元
      order_items.each do |item|
        product = item.product
        product.increment!(:stock_quantity, item.quantity)
      end

      update!(status: :cancelled)
    end
  end

  private

  def generate_order_number
    self.order_number = "ORD-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}"
  end

  def create_order_items_from_cart
    return unless user.cart

    user.cart.cart_items.each do |cart_item|
      order_items.create!(
        product: cart_item.product,
        quantity: cart_item.quantity,
        price: cart_item.product.price
      )
    end

    user.cart.clear
  end
end