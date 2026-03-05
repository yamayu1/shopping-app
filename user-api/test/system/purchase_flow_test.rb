require 'test_helper'

# Simple end-to-end purchase flow test
class PurchaseFlowTest < ActionDispatch::IntegrationTest
  def setup
    @category = create(:category, name: 'Electronics', active: true)
    @product1 = create(:product, name: 'Laptop', price: 1000, stock_quantity: 5, category: @category, )
    @product2 = create(:product, name: 'Mouse', price: 50, stock_quantity: 10, category: @category, )
  end

  def test_complete_purchase_flow
    # Step 1: Register a new user
    post '/api/auth/register', params: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-1234',
      password: 'SecurePass123!',
      password_confirmation: 'SecurePass123!'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 201, response.status
    token = json_response[:data][:token]
    auth_headers = { 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{token}" }

    # Step 2: Browse products
    get '/api/products', headers: { 'Content-Type' => 'application/json' }
    assert_equal 200, response.status

    # Step 3: Add items to cart
    post '/api/cart/items', params: {
      product_id: @product1.id,
      quantity: 2
    }.to_json, headers: auth_headers
    assert_equal 200, response.status

    post '/api/cart/items', params: {
      product_id: @product2.id,
      quantity: 3
    }.to_json, headers: auth_headers
    assert_equal 200, response.status

    # Step 4: Check cart
    get '/api/cart', headers: auth_headers
    assert_equal 200, response.status

    # Step 5: Create shipping address
    post '/api/addresses', params: {
      name: 'John Doe',
      postal_code: '150-0001',
      state: 'Tokyo',
      city: 'Shibuya-ku',
      address_line_1: '1-2-3 Shibuya',
      phone: '+1-555-1234',
      is_default: true
    }.to_json, headers: auth_headers
    assert_equal 201, response.status

    address_id = json_response[:data][:address][:id]

    # Step 6: Place order
    post '/api/orders', params: {
      address_id: address_id,
      payment_method: 'credit_card'
    }.to_json, headers: auth_headers
    assert_equal 201, response.status
    assert_equal true, json_response[:success]

    # Step 7: Check that stock was reduced
    @product1.reload
    assert_equal 3, @product1.stock_quantity

    @product2.reload
    assert_equal 7, @product2.stock_quantity

    # Step 8: Check order history
    get '/api/orders', headers: auth_headers
    assert_equal 200, response.status
  end
end
