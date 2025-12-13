class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :product

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validate :product_available
  validate :sufficient_stock

  def subtotal
    product.price * quantity
  end

  private

  def product_available
    errors.add(:product, 'is not available') unless product&.active?
  end

  def sufficient_stock
    return unless product && quantity

    unless product.can_purchase?(quantity)
      errors.add(:quantity, 'exceeds available stock')
    end
  end
end