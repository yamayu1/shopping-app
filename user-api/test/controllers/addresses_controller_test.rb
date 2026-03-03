require 'test_helper'

class AddressesControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = create(:user, email: 'addruser@example.com', password: 'Password123!', password_confirmation: 'Password123!')
    @headers = { 'Content-Type' => 'application/json' }.merge(auth_header(@user))
  end

  def valid_address_params
    {
      name: 'Taro Yamada',
      postal_code: '150-0001',
      state: 'Tokyo',
      city: 'Shibuya-ku',
      address_line_1: '1-2-3 Shibuya',
      address_line_2: 'Suite 100',
      phone: '+81-90-1234-5678'
    }
  end

  def test_index_returns_user_addresses
    create(:address, user: @user)
    create(:address, user: @user)

    get '/api/addresses', headers: @headers

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
  end

  def test_create_address_success
    post '/api/addresses', params: valid_address_params.to_json, headers: @headers

    assert_equal 201, response.status
    data = json_response
    assert_equal true, data[:success]
  end

  def test_destroy_address_success
    address = create(:address, user: @user)

    delete "/api/addresses/#{address.id}", headers: @headers

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
  end
end
