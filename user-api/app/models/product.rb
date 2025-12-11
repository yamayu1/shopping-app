class Product < ApplicationRecord
  belongs_to :category
  has_many :cart_items, dependent: :destroy
  has_many :order_items, dependent: :destroy
  has_many_attached :images

  validates :name, presence: true
  validates :description, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :stock_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :sku, presence: true, uniqueness: true

  enum status: { active: 0, inactive: 1, discontinued: 2 }

  scope :in_stock, -> { where('stock_quantity > 0') }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  scope :search_by_name, ->(query) { where('name LIKE ?', "%#{query}%") }

  def in_stock?
    stock_quantity > 0 && active?
  end

  def can_purchase?(quantity)
    in_stock? && stock_quantity >= quantity
  end

  def reduce_stock(quantity)
    return false unless can_purchase?(quantity)
    
    with_lock do
      reload
      return false unless can_purchase?(quantity)
      
      update(stock_quantity: stock_quantity - quantity)
    end
  end

  def main_image
    images.attached? ? images.first : nil
  end
end