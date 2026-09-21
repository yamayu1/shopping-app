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

  def test_index_filters_by_status
    create(:order, :shipped, user: @user, address: @address)
    create(:order, user: @user, address: @address) 
    get '/api/orders', params: { status: 'shipped' }, headers: @headers

    assert_equal 200, response.status
    orders = json_response[:data][:orders]
    assert_equal 1, orders.length 
    assert_equal 'shipped', orders.first[:status]
  end

  def test_index_without_status_returns_all
    create(:order, :shipped, user: @user, address: @address)
    create(:order, user: @user, address: @address)

    get '/api/orders', headers: @headers

    assert_equal 200, response.status
    assert_equal 2, json_response[:data][:orders].length
  end
end
