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
end
