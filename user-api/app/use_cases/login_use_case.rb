# ユーザーログインのユースケースクラス

class LoginUseCase
  def initialize(email:, password:)
    @email = email
    @password = password
  end

  def call
    # アクティブなユーザーの中からメールアドレスで検索
    # downcase するのは大文字小文字の違いで別ユーザー扱いにならないようにするため
    user = User.active.find_by(email: @email&.downcase)

    # ユーザーが存在し、かつパスワードが一致する場合のみ成功
    if user&.authenticate(@password)
      { success: true, user: user }
    else
      { success: false, error: 'メールアドレスまたはパスワードが正しくありません' }
    end
  end
end
