Rails.application.routes.draw do
  # ヘルスチェック
  get 'api/health', to: 'application#health_check'

  namespace :api, defaults: { format: :json } do
    # 認証
    post 'auth/login', to: 'v1/authentication#login'
    post 'auth/register', to: 'v1/authentication#register'
    post 'auth/logout', to: 'v1/authentication#logout'
    get 'auth/me', to: 'v1/authentication#me'
    get 'auth/profile', to: 'v1/profiles#show'
    put 'auth/profile', to: 'v1/profiles#update'
    post 'auth/forgot_password', to: 'v1/authentication#forgot_password'
    post 'auth/reset_password', to: 'v1/authentication#reset_password'

    # 商品
    resources :products, only: [:index, :show], controller: 'v1/products' do
      collection do
        get :search
        get :featured
      end
    end

    # カテゴリー
    get 'categories', to: 'products#categories'

    # カート
    get 'cart', to: 'v1/carts#show'
    post 'cart/items', to: 'v1/carts#add_item'
    put 'cart/items', to: 'v1/carts#update_item'
    delete 'cart/items', to: 'v1/carts#remove_item'
    delete 'cart', to: 'v1/carts#destroy'

    # 住所
    resources :addresses, controller: 'v1/addresses'

    # 注文
    resources :orders, only: [:index, :show, :create], controller: 'v1/orders' do
      member do
        post :confirm_payment
      end
    end
  end
end
