Rails.application.routes.draw do
  # ヘルスチェック
  get 'api/health', to: 'application#health_check'

  scope 'api', defaults: { format: :json } do
    # 認証
    post 'auth/login', to: 'authentication#login'
    post 'auth/register', to: 'authentication#register'
    post 'auth/logout', to: 'authentication#logout'
    get 'auth/me', to: 'authentication#me'
    get 'auth/profile', to: 'profiles#show'
    put 'auth/profile', to: 'profiles#update'
    post 'auth/forgot_password', to: 'authentication#forgot_password'
    post 'auth/reset_password', to: 'authentication#reset_password'

    # 商品
    resources :products, only: [:index, :show] do
      collection do
        get :search
        get :featured
      end
    end

    # カテゴリー
    get 'categories', to: 'products#categories'

    # カート
    get 'cart', to: 'carts#show'
    post 'cart/items', to: 'carts#add_item'
    put 'cart/items', to: 'carts#update_item'
    delete 'cart/items', to: 'carts#remove_item'
    delete 'cart', to: 'carts#destroy'

    # 住所
    resources :addresses

    # 注文
    resources :orders, only: [:index, :show, :create] do
      member do
        post :confirm_payment
      end
    end
  end
end
