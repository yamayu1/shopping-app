Rails.application.config.secret_key_base = ENV.fetch('SECRET_KEY_BASE') do
  raise 'SECRET_KEY_BASE が設定されていません' if Rails.env.production?
  'development_secret_key_base_shopping_app_2026'
end