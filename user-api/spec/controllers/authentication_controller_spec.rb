require 'rails_helper'

RSpec.describe AuthenticationController, type: :controller do
  describe 'POST #login' do
    let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    context 'with valid credentials' do
      it 'returns success response with token' do
        post :login, params: { email: 'test@example.com', password: 'password123' }
        
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['token']).to be_present
        expect(json_response['data']['user']['email']).to eq('test@example.com')
      end
    end

    context 'with invalid credentials' do
      it 'returns error response' do
        post :login, params: { email: 'test@example.com', password: 'wrongpassword' }
        
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['message']).to eq('Invalid email or password')
      end
    end

    context 'with non-existent user' do
      it 'returns error response' do
        post :login, params: { email: 'nonexistent@example.com', password: 'password123' }
        
        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end
    end
  end

  describe 'POST #register' do
    let(:valid_params) do
      {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '090-1234-5678'
      }
    end

    context 'with valid parameters' do
      it 'creates new user and returns token' do
        expect {
          post :register, params: valid_params
        }.to change(User, :count).by(1)
        
        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['token']).to be_present
        expect(json_response['data']['user']['email']).to eq('newuser@example.com')
      end

      it 'creates cart for new user' do
        post :register, params: valid_params
        user = User.find_by(email: 'newuser@example.com')
        expect(user.cart).to be_present
      end
    end

    context 'with invalid parameters' do
      it 'returns validation errors' do
        post :register, params: valid_params.merge(email: '')
        
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to be_present
      end
    end

    context 'with duplicate email' do
      before { create(:user, email: 'newuser@example.com') }

      it 'returns validation error' do
        post :register, params: valid_params
        
        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to include('Email has already been taken')
      end
    end
  end

  describe 'POST #logout' do
    let(:user) { create(:user) }

    it 'returns success response' do
      sign_in_user(user)
      post :logout
      
      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['success']).to be true
      expect(json_response['message']).to eq('Logout successful')
    end
  end

  describe 'GET #me' do
    let(:user) { create(:user) }

    context 'when authenticated' do
      it 'returns current user data' do
        sign_in_user(user)
        get :me
        
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['user']['id']).to eq(user.id)
        expect(json_response['data']['user']['email']).to eq(user.email)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        get :me
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST #forgot_password' do
    let(:user) { create(:user, email: 'test@example.com') }

    it 'generates password reset token' do
      expect {
        post :forgot_password, params: { email: 'test@example.com' }
      }.to change { user.reload.password_reset_token }.from(nil)
      
      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['success']).to be true
    end

    it 'returns success even for non-existent email' do
      post :forgot_password, params: { email: 'nonexistent@example.com' }
      
      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['success']).to be true
    end
  end

  describe 'POST #reset_password' do
    let(:user) { create(:user) }

    before do
      user.generate_password_reset_token
    end

    context 'with valid token' do
      it 'resets password and returns token' do
        post :reset_password, params: { 
          token: user.password_reset_token, 
          password: 'newpassword123' 
        }
        
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['data']['token']).to be_present
        
        user.reload
        expect(user.authenticate('newpassword123')).to be_truthy
        expect(user.password_reset_token).to be_nil
      end
    end

    context 'with invalid token' do
      it 'returns error' do
        post :reset_password, params: { 
          token: 'invalid-token', 
          password: 'newpassword123' 
        }
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end
    end

    context 'with expired token' do
      it 'returns error' do
        user.update(password_reset_expires_at: 1.hour.ago)
        
        post :reset_password, params: { 
          token: user.password_reset_token, 
          password: 'newpassword123' 
        }
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
      end
    end
  end

  private

  def sign_in_user(user)
    token = JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, 
                      Rails.application.credentials.secret_key_base, 'HS256')
    request.headers['Authorization'] = "Bearer #{token}"
  end
end