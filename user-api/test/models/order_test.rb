require 'test_helper'

class OrderTest < ActiveSupport::TestCase
  def setup
    @user = create(:user)
    @category = create(:category)
    @address = create(:address, user: @user)
  end

  def test_valid_order
    order = build(:order, user: @user, address: @address)
    assert order.valid?
  end

  def test_status_enum
    order = create(:order, user: @user, address: @address)
    assert order.pending?

    order.update!(status: :confirmed)
    assert order.confirmed?
  end

  def test_belongs_to_user_and_address
    order = create(:order, user: @user, address: @address)
    assert_equal @user, order.user
    assert_equal @address, order.address
  end

  def test_can_cancel_when_pending
    order = create(:order, user: @user, address: @address)
    assert order.can_cancel?
  end

  def test_cannot_cancel_when_shipped
    order = create(:order, :shipped, user: @user, address: @address)
    assert_not order.can_cancel?
  end

  def test_cancel_changes_status_to_cancelled
    order = create(:order, user: @user, address: @address)
    assert order.cancel!
    assert order.cancelled?
  end

  def test_cancel_restores_stock
    product = create(:product, category: @category, stock_quantity: 5)
    order = create(:order, user: @user, address: @address)
    order.order_items.create!(product: product, quantity: 3, price: product.price)

    order.cancel!

    assert_equal 8, product.reload.stock_quantity  
  end

  def test_cancel_returns_false_when_shipped
    order = create(:order, :shipped, user: @user, address: @address)
    assert_not order.cancel!
    assert order.shipped?   # 状態は変わらない
  end
end
