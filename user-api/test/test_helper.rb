ENV['RACK_ENV'] = 'test'

require 'simplecov'
SimpleCov.start do
  add_filter '/test/'
  add_filter '/config/'
  add_group 'Models', 'app/models'
  add_group 'Controllers', 'app/controllers'
  add_group 'Services', 'app/services'
end

require 'minitest/autorun'
require 'minitest/pride'
require 'rack/test'
require 'database_cleaner'
require 'factory_bot'
require 'faker'

# アプリケーションを読み込み
require_relative '../app'

# DatabaseCleanerの設定
DatabaseCleaner.strategy = :transaction

class Minitest::Test
  include Rack::Test::Methods
  include FactoryBot::Syntax::Methods

  def app
    Sinatra::Application
  end

  def setup
    DatabaseCleaner.start
  end

  def teardown
    DatabaseCleaner.clean
  end

  # 認証ヘッダー作成用ヘルパーメソッド
  def auth_header(user)
    token = JWT.encode(
      { user_id: user.id, exp: Time.now.to_i + 3600 },
      ENV['JWT_SECRET'] || 'test_secret',
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}" }
  end

  # JSONレスポンスパース用ヘルパーメソッド
  def json_response
    JSON.parse(last_response.body, symbolize_names: true)
  end
end

# ファクトリーを読み込み
FactoryBot.find_definitions
