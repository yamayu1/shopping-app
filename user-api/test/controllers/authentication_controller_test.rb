require 'test_helper'

class AuthenticationControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = create(:user, email: 'test@example.com', password: 'Password123!', password_confirmation: 'Password123!')
  end

  def test_register_with_valid_data
    post '/api/auth/register', params: {
      first_name: 'Taro',
      last_name: 'Yamada',
      email: 'newuser@example.com',
      phone: '090-9999-8888',
      password: 'SecurePass123!',
      password_confirmation: 'SecurePass123!'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 201, response.status
    data = json_response
    assert_equal true, data[:success]
    assert_not_nil data[:data][:token]
  end

  def test_login_with_valid_credentials
    post '/api/auth/login', params: {
      email: 'test@example.com',
      password: 'Password123!'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
    assert_not_nil data[:data][:token]
  end

  def test_login_with_wrong_password
    post '/api/auth/login', params: {
      email: 'test@example.com',
      password: 'WrongPassword'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 401, response.status
  end

  def test_get_profile_without_auth
    get '/api/auth/profile'

    assert_equal 401, response.status
  end
end
