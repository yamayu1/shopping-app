require 'test_helper'

class CartsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = create(:user, email: 'cartuser@example.com', password: 'Password123!', password_confirmation: 'Password123!')
    @category = create(:category)
    @product = create(:product, category: @category, stock_quantity: 10, status: :active, price: 500)
    @headers = { 'Content-Type' => 'application/json' }.merge(auth_header(@user))
  end

  def test_show_empty_cart
    get '/api/cart', headers: @headers

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
  end

  def test_add_item_to_cart
    post '/api/cart/items', params: {
      product_id: @product.id,
      quantity: 2
    }.to_json, headers: @headers

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
  end

  def test_remove_item
    @user.cart.add_item(@product, 2)

    delete '/api/cart/items', params: {
      product_id: @product.id
    }.to_json, headers: @headers

    assert_equal 200, response.status
  end
end
