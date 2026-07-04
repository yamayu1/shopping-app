class UserMailer < ApplicationMailer
  def password_reset(user)
    @user = user
    @reset_url = "http://localhost:3000/reset-password?token=#{user.password_reset_token}"

    mail(
      to: @user.email,
      subject: '【Shopping App】パスワード再設定のご案内'
    )
  end
end
