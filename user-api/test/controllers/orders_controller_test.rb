require 'test_helper'

class OrdersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = create(:user, email: 'orderuser@example.com')
    @category = create(:category)
    @product = create(:product, category: @category, stock_quantity: 10, price: 500)
    @address = create(:address, user: @user)
    @headers = { 'Content-Type' => 'application/json' }.merge(auth_header(@user))
  end

  def test_index_returns_user_orders
    create(:order, user: @user, address: @address)
    create(:order, user: @user, address: @address)

    get '/api/orders', headers: @headers

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
  end

  def test_create_order_success
    @user.cart.add_item(@product, 2)

    post '/api/orders', params: {
      address_id: @address.id,
      payment_method: 'credit_card'
    }.to_json, headers: @headers

    assert_equal 201, response.status
    data = json_response
    assert_equal true, data[:success]
  end
end
