class UserMailer < ApplicationMailer
  def password_reset(user)
    @user = user
    @reset_url = "http://localhost:3000/reset-password?token=#{user.password_reset_token}"

    mail(
      to: @user.email,
      subject: '【Shopping App】パスワード再設定のご案内'
    )
  end

  def email_confirmation(user)
    @user = user
    @confirmation_url = "http://localhost:3001/api/auth/verify_email?token=#{user.email_confirmation_token}"

    mail(
      to: @user.email,
      subject: '【Shopping App】メールアドレス確認のご案内'
    )
  end
end
