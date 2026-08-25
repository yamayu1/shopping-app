# ユーザー登録のユースケースクラス

class RegisterUserUseCase
  def initialize(user_params:)
    @user_params = user_params
  end

  def call
    user = User.new(@user_params)

    if user.save
      { success: true, user: user }
    else
      { success: false, errors: user.errors.full_messages }
    end
  end
end
