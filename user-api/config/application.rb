require_relative 'boot'

require 'rails'
require 'active_model/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'active_storage/engine'

Bundler.require(*Rails.groups)

module ShoppingUserApi
  class Application < Rails::Application
    config.load_defaults 7.0
    config.api_only = true

    # タイムゾーン
    config.time_zone = 'Tokyo'

    # ActiveStorageの設定
    config.active_storage.service = :local
  end
end
