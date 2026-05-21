Rails.application.configure do
  config.cache_classes = false
  config.eager_load = false
  config.consider_all_requests_local = true
  config.active_storage.service = :local
  config.log_level = :debug

  # メール送信設定
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address: ENV.fetch('SMTP_HOST', 'localhost'),
    port:    ENV.fetch('SMTP_PORT', '1025').to_i
  }
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.perform_deliveries = true
  config.action_mailer.default_url_options = {
    host:     ENV.fetch('APP_HOST', 'localhost'),
    port:     ENV.fetch('APP_PORT', '3000').to_i,
    protocol: ENV.fetch('APP_PROTOCOL', 'http')
  }
end