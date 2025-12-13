class Cart < ApplicationRecord
  belongs_to :user
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  def add_item(product, quantity = 1)
    return false unless product.can_purchase?(quantity)

    existing_item = cart_items.find_by(product: product)
    
    if existing_item
      new_quantity = existing_item.quantity + quantity
      return false unless product.can_purchase?(new_quantity)
      
      existing_item.update(quantity: new_quantity)
    else
      cart_items.create(product: product, quantity: quantity)
    end
  end

  def update_item(product, quantity)
    return false unless product.can_purchase?(quantity)

    item = cart_items.find_by(product: product)
    return false unless item

    if quantity <= 0
      item.destroy
    else
      item.update(quantity: quantity)
    end
  end

  def remove_item(product)
    cart_items.find_by(product: product)&.destroy
  end

  def total_price
    cart_items.sum { |item| item.product.price * item.quantity }
  end

  def total_items
    cart_items.sum(:quantity)
  end

  def clear
    cart_items.destroy_all
  end

  def empty?
    cart_items.empty?
  end
end