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

  def test_register_sends_confirmation_email
    assert_difference 'ActionMailer::Base.deliveries.size', 1 do
      post '/api/auth/register', params: {
        first_name: 'Hanako',
        last_name: 'Suzuki',
        email: 'confirm-test@example.com',
        phone: '090-1234-5678',
        password: 'SecurePass123!',
        password_confirmation: 'SecurePass123!'
      }.to_json, headers: { 'Content-Type' => 'application/json' }
    end
    assert_equal 201, response.status
  end

  def test_verify_email_with_valid_token
    @user.generate_email_confirmation_token
    get "/api/auth/verify_email?token=#{@user.email_confirmation_token}"

    assert_response :redirect
    assert @user.reload.email_verified?
  end

  def test_verify_email_when_already_verified
    @user.generate_email_confirmation_token
    @user.confirm_email!
    get "/api/auth/verify_email?token=#{@user.email_confirmation_token}"

    assert_response :redirect
    assert_match 'status=already', response.location
  end

  def test_verify_email_with_invalid_token
    get '/api/auth/verify_email?token=invalidtoken123'

    assert_response :redirect
    assert_match 'status=error', response.location
  end
end