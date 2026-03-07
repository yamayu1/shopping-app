ENV['RAILS_ENV'] ||= 'test'

require 'simplecov'
SimpleCov.start 'rails' do
  add_filter '/test/'
  add_filter '/config/'
  add_group 'Models', 'app/models'
  add_group 'Controllers', 'app/controllers'
end

require_relative '../config/environment'
require 'rails/test_help'
require 'factory_bot_rails'

class ActiveSupport::TestCase
  include FactoryBot::Syntax::Methods

  self.use_transactional_tests = true

  def auth_header(user)
    token = JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base || 'fallback_secret',
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}" }
  end

  # JSONレスポンスパース用ヘルパーメソッド
  def json_response
    JSON.parse(response.body, symbolize_names: true)
  end
end
