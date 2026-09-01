Rails.application.configure do
  config.cache_classes = true
  config.eager_load = false
  config.consider_all_requests_local = true
  config.active_storage.service = :local
  config.action_mailer.delivery_method = :test
end