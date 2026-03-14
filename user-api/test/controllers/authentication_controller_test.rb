require 'test_helper'

class AuthenticationControllerTest < Minitest::Test
  def setup
    super
    @user = create(:user, email: 'test@example.com', password: 'Password123!')
  end

  # POST /api/auth/register
  def test_register_with_valid_data
    user_params = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'newuser@example.com',
      phone: '+1-555-1234',
      password: 'SecurePass123!',
      password_confirmation: 'SecurePass123!'
    }

    post '/api/auth/register', user_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 201, last_response.status
    assert_equal 'application/json', last_response.content_type

    response = json_response
    assert_equal true, response[:success]
    assert_not_nil response[:data][:access_token]
    assert_equal 'newuser@example.com', response[:data][:user][:email]
  end

  def test_register_with_missing_fields
    user_params = {
      email: 'newuser@example.com'
    }

    post '/api/auth/register', user_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 422, last_response.status
    response = json_response
    assert_equal false, response[:success]
    assert_not_nil response[:errors]
  end

  def test_register_with_duplicate_email
    user_params = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: @user.email,
      phone: '+1-555-5678',
      password: 'Password123!',
      password_confirmation: 'Password123!'
    }

    post '/api/auth/register', user_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 422, last_response.status
    response = json_response
    assert_equal false, response[:success]
  end

  def test_register_with_password_mismatch
    user_params = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'newuser@example.com',
      phone: '+1-555-1234',
      password: 'Password123!',
      password_confirmation: 'DifferentPassword!'
    }

    post '/api/auth/register', user_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 422, last_response.status
  end

  # POST /api/auth/login
  def test_login_with_valid_credentials
    login_params = {
      email: 'test@example.com',
      password: 'Password123!'
    }

    post '/api/auth/login', login_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
    assert_not_nil response[:data][:access_token]
    assert_equal @user.email, response[:data][:user][:email]
  end

  def test_login_with_invalid_email
    login_params = {
      email: 'nonexistent@example.com',
      password: 'Password123!'
    }

    post '/api/auth/login', login_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 401, last_response.status
    response = json_response
    assert_equal false, response[:success]
  end

  def test_login_with_invalid_password
    login_params = {
      email: 'test@example.com',
      password: 'WrongPassword'
    }

    post '/api/auth/login', login_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 401, last_response.status
    response = json_response
    assert_equal false, response[:success]
  end

  def test_login_with_missing_credentials
    post '/api/auth/login', {}.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 400, last_response.status
  end

  # POST /api/auth/logout
  def test_logout_with_valid_token
    post '/api/auth/logout', {}.to_json, auth_header(@user).merge({ 'CONTENT_TYPE' => 'application/json' })

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
  end

  def test_logout_without_token
    post '/api/auth/logout', {}.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 401, last_response.status
  end

  # POST /api/auth/forgot-password
  def test_forgot_password_with_valid_email
    forgot_params = {
      email: @user.email
    }

    post '/api/auth/forgot-password', forgot_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]

    @user.reload
    assert_not_nil @user.password_reset_token
  end

  def test_forgot_password_with_nonexistent_email
    forgot_params = {
      email: 'nonexistent@example.com'
    }

    post '/api/auth/forgot-password', forgot_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    # セキュリティのため200を返す（メールの存在有無を公開しない）
    assert_equal 200, last_response.status
  end

  # POST /api/auth/reset-password
  def test_reset_password_with_valid_token
    @user.generate_password_reset_token

    reset_params = {
      token: @user.password_reset_token,
      email: @user.email,
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    post '/api/auth/reset-password', reset_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]

    @user.reload
    assert @user.authenticate('NewPassword123!')
    assert_nil @user.password_reset_token
  end

  def test_reset_password_with_expired_token
    @user.password_reset_token = 'test_token'
    @user.password_reset_expires_at = 2.hours.ago
    @user.save

    reset_params = {
      token: @user.password_reset_token,
      email: @user.email,
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    post '/api/auth/reset-password', reset_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 400, last_response.status
    response = json_response
    assert_equal false, response[:success]
  end

  def test_reset_password_with_invalid_token
    reset_params = {
      token: 'invalid_token',
      email: @user.email,
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    post '/api/auth/reset-password', reset_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 400, last_response.status
  end

  # GET /api/auth/profile
  def test_get_profile_with_valid_token
    get '/api/auth/profile', {}, auth_header(@user)

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
    assert_equal @user.email, response[:data][:email]
  end

  def test_get_profile_without_token
    get '/api/auth/profile'

    assert_equal 401, last_response.status
  end

  # PUT /api/auth/profile
  def test_update_profile_with_valid_data
    update_params = {
      first_name: 'Updated',
      last_name: 'Name',
      phone: '+1-555-9999'
    }

    put '/api/auth/profile', update_params.to_json, auth_header(@user).merge({ 'CONTENT_TYPE' => 'application/json' })

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
    assert_equal 'Updated', response[:data][:first_name]
    assert_equal 'Name', response[:data][:last_name]
  end

  def test_update_profile_without_token
    update_params = {
      first_name: 'Updated'
    }

    put '/api/auth/profile', update_params.to_json, { 'CONTENT_TYPE' => 'application/json' }

    assert_equal 401, last_response.status
  end
end
