class AuthenticationController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login, :register, :forgot_password, :reset_password]

  def login
    user = User.active.find_by(email: params[:email]&.downcase)
    
    if user&.authenticate(params[:password])
      token = generate_jwt_token(user)
      
      render_success({
        user: user_data(user),
        token: token
      }, 'Login successful')
    else
      render_error('Invalid email or password', :unauthorized)
    end
  end

  def register
    user = User.new(user_params)
    
    if user.save
      token = generate_jwt_token(user)
      
      render_success({
        user: user_data(user),
        token: token
      }, 'Registration successful', :created)
    else
      render_error('Registration failed', :unprocessable_entity, user.errors.full_messages)
    end
  end

  def logout
    render_success({}, 'Logout successful')
  end

  def me
    render_success({
      user: user_data(current_user)
    })
  end

  def forgot_password
    user = User.active.find_by(email: params[:email]&.downcase)
    
    if user
      user.generate_password_reset_token
      # 本番環境ではここでメールを送信する
      # UserMailer.password_reset(user).deliver_now
    end
    
    # メール列挙攻撃を防ぐため常に成功を返す
    render_success({}, 'If the email exists, a password reset link has been sent')
  end

  def reset_password
    user = User.active.find_by(password_reset_token: params[:token])
    
    if user&.password_reset_expires_at && !user.password_reset_expired?
      if user.update(password: params[:password], password_reset_token: nil, password_reset_expires_at: nil)
        token = generate_jwt_token(user)
        
        render_success({
          user: user_data(user),
          token: token
        }, 'Password reset successful')
      else
        render_error('Password reset failed', :unprocessable_entity, user.errors.full_messages)
      end
    else
      render_error('Invalid or expired reset token', :bad_request)
    end
  end

  private

  def user_params
    params.permit(:email, :password, :first_name, :last_name, :phone, :birth_date)
  end

  def user_data(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone: user.phone,
      birth_date: user.birth_date,
      created_at: user.created_at
    }
  end
end