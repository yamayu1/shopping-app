class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authenticate_user!, except: [:health_check]

  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: '見つかりませんでした' }, status: :not_found
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def authenticate_user!
    token = request.headers['Authorization']&.split(' ')&.last

    if token
      begin
        decoded_token = JWT.decode(token, jwt_secret, true, algorithm: 'HS256')
        user_id = decoded_token[0]['user_id']
        @current_user = User.active.find(user_id) if user_id
      rescue JWT::DecodeError, JWT::ExpiredSignature
        @current_user = nil
      end
    end

    unless @current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def generate_jwt_token(user)
    payload = {
      user_id: user.id,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, jwt_secret, 'HS256')
  end

  def jwt_secret
    Rails.application.credentials.secret_key_base || 'fallback_secret'
  end

  def render_success(data = {}, message = 'Success', status = :ok)
    render json: { success: true, message: message, data: data }, status: status
  end

  def render_error(message = 'Error', status = :bad_request, errors = [])
    render json: { success: false, message: message, errors: errors }, status: status
  end

  def health_check
    render json: { status: 'ok' }
  end
end
