require 'test_helper'

class CartTest < ActiveSupport::TestCase
  def setup
    @user = create(:user)
    @cart = @user.cart
    @category = create(:category)
    @product = create(:product, category: @category, stock_quantity: 10, price: 500)
  end

  def test_add_item
    result = @cart.add_item(@product, 2)
    assert result
    assert_equal 1, @cart.cart_items.count
    assert_equal 2, @cart.cart_items.first.quantity
  end

  def test_total_price
    product2 = create(:product, category: @category, stock_quantity: 10, price: 300)
    @cart.add_item(@product, 2)
    @cart.add_item(product2, 1)
    assert_equal 1300, @cart.total_price
  end

  def test_total_price_uses_sale_price
    user = create(:user)
    cart = create(:cart, user: user)
    product = create(:product, price: 1000, sale_price: 800, stock_quantity: 10)
    cart.add_item(product, 2)

    assert_equal 1600, cart.total_price
  end
end
