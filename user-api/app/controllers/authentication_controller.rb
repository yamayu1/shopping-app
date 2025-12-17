class AuthenticationController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login, :register, :forgot_password, :reset_password]

  def login
    # メールアドレスでユーザーを検索
    user = User.active.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      token = generate_jwt_token(user)
      
      render_success({
        user: user_data(user),
        token: token
      }, 'ログインしました')
    else
      render_error('メールアドレスまたはパスワードが正しくありません', :unauthorized)
    end
  end

  def register
    user = User.new(user_params)
    
    if user.save
      token = generate_jwt_token(user)
      
      render_success({
        user: user_data(user),
        token: token
      }, '会員登録が完了しました', :created)
    else
      render_error('会員登録に失敗しました', :unprocessable_entity, user.errors.full_messages)
    end
  end

  def logout
    render_success({}, 'ログアウトしました')
  end

  def me
    render_success({
      user: user_data(current_user)
    })
  end

  def change_password
    unless current_user.authenticate(params[:current_password])
      return render_error('現在のパスワードが正しくありません', :unauthorized)
    end

    if current_user.update(password: params[:new_password])
      render_success({}, 'パスワードを変更しました')
    else
      render_error('パスワードの変更に失敗しました', :unprocessable_entity, current_user.errors.full_messages)
    end
  end

  def forgot_password
    user = User.active.find_by(email: params[:email]&.downcase)
    
    if user
      user.generate_password_reset_token
      # UserMailer.password_reset(user).deliver_now
    end

    # メールアドレスが存在しなくても同じレスポンスを返す
    render_success({}, 'パスワードリセット用のメールを送信しました')
  end

  def reset_password
    user = User.active.find_by(password_reset_token: params[:token])
    
    if user&.password_reset_expires_at && !user.password_reset_expired?
      if user.update(password: params[:password], password_reset_token: nil, password_reset_expires_at: nil)
        token = generate_jwt_token(user)
        
        render_success({
          user: user_data(user),
          token: token
        }, 'パスワードをリセットしました')
      else
        render_error('パスワードのリセットに失敗しました', :unprocessable_entity, user.errors.full_messages)
      end
    else
      render_error('無効または期限切れのトークンです', :bad_request)
    end
  end

  private

  def user_params
    params.permit(:email, :password, :password_confirmation, :first_name, :last_name, :phone, :birth_date)
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