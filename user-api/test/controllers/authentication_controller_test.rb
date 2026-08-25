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

  def test_reset_password_with_valid_token
    @user.generate_password_reset_token
    token = @user.password_reset_token

    post '/api/auth/reset_password', params: {
      token: token,
      password: 'NewPassword123!'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 200, response.status
    assert @user.reload.authenticate('NewPassword123!')
  end

  def test_reset_password_with_expired_token
    @user.generate_password_reset_token
    token = @user.password_reset_token

    travel_to 2.hours.from_now do
      post '/api/auth/reset_password', params: {
        token: token,
        password: 'NewPassword123!'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      assert_equal 400, response.status
    end

    assert @user.reload.authenticate('Password123!')
  end

  def test_change_password_with_valid_current_password
    post '/api/auth/change-password', params: {
      current_password: 'Password123!',
      new_password: 'NewPassword456!'
    }.to_json, headers: auth_header(@user).merge('Content-Type' => 'application/json')

    assert_equal 200, response.status
    assert @user.reload.authenticate('NewPassword456!')
  end

  def test_change_password_with_wrong_current_password_returns_422
    post '/api/auth/change-password', params: {
      current_password: 'WrongPassword',
      new_password: 'NewPassword456!'
    }.to_json, headers: auth_header(@user).merge('Content-Type' => 'application/json')

    assert_equal 422, response.status
    assert_equal '現在のパスワードが正しくありません', json_response[:message]
    assert @user.reload.authenticate('Password123!')
  end

  def test_change_password_without_auth_returns_401
    post '/api/auth/change-password', params: {
      current_password: 'Password123!',
      new_password: 'NewPassword456!'
    }.to_json, headers: { 'Content-Type' => 'application/json' }

    assert_equal 401, response.status
  end
end