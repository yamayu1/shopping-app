require 'test_helper'

# 結合テスト: 会員登録から注文完了までの購入フロー
class PurchaseFlowTest < Minitest::Test
  def setup
    super
    @category = create(:category, name: 'Electronics')
    @product1 = create(:product, name: 'Laptop', price: 1000, stock_quantity: 5, category: @category)
    @product2 = create(:product, name: 'Mouse', price: 50, stock_quantity: 10, category: @category)
  end

  def test_complete_purchase_flow_for_new_user
    # ステップ1: ユーザー登録
    registration_params = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-1234',
      password: 'SecurePass123!',
      password_confirmation: 'SecurePass123!'
    }

    post '/api/auth/register', registration_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 201, last_response.status

    registration_response = json_response
    token = registration_response[:data][:access_token]
    user_id = registration_response[:data][:user][:id]
    auth_headers = { 'Authorization' => "Bearer #{token}", 'CONTENT_TYPE' => 'application/json' }

    # ステップ2: 商品一覧を閲覧
    get '/api/products'
    assert_equal 200, last_response.status
    products_response = json_response
    assert_operator products_response[:data].length, :>, 0

    # ステップ3: カートに商品を追加
    cart_item1_params = {
      product_id: @product1.id,
      quantity: 2
    }

    post '/api/cart/items', cart_item1_params.to_json, auth_headers
    assert_equal 201, last_response.status

    cart_item2_params = {
      product_id: @product2.id,
      quantity: 3
    }

    post '/api/cart/items', cart_item2_params.to_json, auth_headers
    assert_equal 201, last_response.status

    # ステップ4: カートを確認
    get '/api/cart', {}, auth_headers
    assert_equal 200, last_response.status

    cart_response = json_response
    assert_equal 2, cart_response[:data][:items].length
    expected_total = (@product1.price * 2) + (@product2.price * 3)
    assert_equal expected_total, cart_response[:data][:total_amount]

    # ステップ5: カート内の数量を変更
    cart_item_id = cart_response[:data][:items].first[:id]
    update_params = { quantity: 1 }

    put "/api/cart/items/#{cart_item_id}", update_params.to_json, auth_headers
    assert_equal 200, last_response.status

    # ステップ6: 配送先住所を作成
    address_params = {
      type: 'shipping',
      first_name: 'John',
      last_name: 'Doe',
      address_line_1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94102',
      country: 'USA',
      phone: '+1-555-1234',
      is_default: true
    }

    post '/api/addresses', address_params.to_json, auth_headers
    assert_equal 201, last_response.status

    address_response = json_response
    address_id = address_response[:data][:id]

    # ステップ7: 注文確定（チェックアウト）
    order_params = {
      shipping_address_id: address_id,
      billing_address_id: address_id,
      payment_method: 'credit_card',
      notes: 'Please deliver in the morning'
    }

    post '/api/orders', order_params.to_json, auth_headers
    assert_equal 201, last_response.status

    order_response = json_response
    assert_not_nil order_response[:data][:order_number]
    assert_equal 'pending', order_response[:data][:status]
    assert_equal 'pending', order_response[:data][:payment_status]

    # 在庫が減ったことを確認
    @product1.reload
    assert_equal 4, @product1.stock_quantity  # 5 - 1（数量変更後）

    @product2.reload
    assert_equal 7, @product2.stock_quantity  # 10 - 3

    # ステップ8: 注文履歴を確認
    get '/api/orders', {}, auth_headers
    assert_equal 200, last_response.status

    orders_response = json_response
    assert_equal 1, orders_response[:data].length

    # ステップ9: 注文詳細を確認
    order_id = order_response[:data][:id]
    get "/api/orders/#{order_id}", {}, auth_headers
    assert_equal 200, last_response.status

    order_detail_response = json_response
    assert_equal order_id, order_detail_response[:data][:id]
    assert_equal 2, order_detail_response[:data][:items].length

    # ステップ10: 更新後のプロフィールを確認
    get '/api/auth/profile', {}, auth_headers
    assert_equal 200, last_response.status

    profile_response = json_response
    assert_equal 'john.doe@example.com', profile_response[:data][:email]

    # ステップ11: ログアウト
    post '/api/auth/logout', {}.to_json, auth_headers
    assert_equal 200, last_response.status
  end

  def test_concurrent_purchase_of_limited_stock
    # 在庫限定の商品を作成
    limited_product = create(:product, name: 'Limited Edition', price: 500, stock_quantity: 2, category: @category)

    # 3人のユーザーを作成
    users = 3.times.map do |i|
      user_params = {
        first_name: "User#{i}",
        last_name: "Test",
        email: "user#{i}@example.com",
        phone: "+1-555-000#{i}",
        password: 'Password123!',
        password_confirmation: 'Password123!'
      }

      post '/api/auth/register', user_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
      assert_equal 201, last_response.status

      registration_response = json_response
      {
        token: registration_response[:data][:access_token],
        user_id: registration_response[:data][:user][:id]
      }
    end

    # 各ユーザーが住所を作成
    users.each do |user|
      auth_headers = { 'Authorization' => "Bearer #{user[:token]}", 'CONTENT_TYPE' => 'application/json' }

      address_params = {
        type: 'shipping',
        first_name: 'Test',
        last_name: 'User',
        address_line_1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'USA',
        phone: '+1-555-0000',
        is_default: true
      }

      post '/api/addresses', address_params.to_json, auth_headers
      assert_equal 201, last_response.status

      address_response = json_response
      user[:address_id] = address_response[:data][:id]

      # カートに商品を追加
      cart_params = {
        product_id: limited_product.id,
        quantity: 1
      }

      post '/api/cart/items', cart_params.to_json, auth_headers
      assert_equal 201, last_response.status
    end

    # 全ユーザーが同時にチェックアウトを試みる
    successful_orders = 0
    failed_orders = 0

    users.each do |user|
      auth_headers = { 'Authorization' => "Bearer #{user[:token]}", 'CONTENT_TYPE' => 'application/json' }

      order_params = {
        shipping_address_id: user[:address_id],
        billing_address_id: user[:address_id],
        payment_method: 'credit_card'
      }

      post '/api/orders', order_params.to_json, auth_headers

      if last_response.status == 201
        successful_orders += 1
      else
        failed_orders += 1
      end
    end

    # 在庫が2なので、2件の注文のみ成功するはず
    assert_equal 2, successful_orders
    assert_equal 1, failed_orders

    # 最終在庫が0であることを確認
    limited_product.reload
    assert_equal 0, limited_product.stock_quantity
  end

  def test_user_cannot_purchase_inactive_product
    # ステップ1: ユーザーを作成してトークンを取得
    registration_params = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '+1-555-5678',
      password: 'Password123!',
      password_confirmation: 'Password123!'
    }

    post '/api/auth/register', registration_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 201, last_response.status

    registration_response = json_response
    auth_headers = {
      'Authorization' => "Bearer #{registration_response[:data][:access_token]}",
      'CONTENT_TYPE' => 'application/json'
    }

    # ステップ2: 非アクティブな商品を作成
    inactive_product = create(:product, :inactive, category: @category)

    # ステップ3: 非アクティブな商品をカートに追加しようとする
    cart_params = {
      product_id: inactive_product.id,
      quantity: 1
    }

    post '/api/cart/items', cart_params.to_json, auth_headers

    # 商品が非アクティブなので失敗するはず
    assert_equal 422, last_response.status
    error_response = json_response
    assert_equal false, error_response[:success]
  end

  def test_password_reset_flow
    # ステップ1: ユーザーを作成
    user = create(:user, email: 'resettest@example.com', password: 'OldPassword123!')

    # ステップ2: パスワードリセットをリクエスト
    forgot_params = { email: user.email }
    post '/api/auth/forgot-password', forgot_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 200, last_response.status

    # ステップ3: リセットトークンを取得
    user.reload
    reset_token = user.password_reset_token
    assert_not_nil reset_token

    # ステップ4: パスワードをリセット
    reset_params = {
      token: reset_token,
      email: user.email,
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    post '/api/auth/reset-password', reset_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 200, last_response.status

    # ステップ5: 新しいパスワードでログイン
    login_params = {
      email: user.email,
      password: 'NewPassword123!'
    }

    post '/api/auth/login', login_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 200, last_response.status

    login_response = json_response
    assert_not_nil login_response[:data][:access_token]

    # ステップ6: 古いパスワードが使えないことを確認
    old_login_params = {
      email: user.email,
      password: 'OldPassword123!'
    }

    post '/api/auth/login', old_login_params.to_json, { 'CONTENT_TYPE' => 'application/json' }
    assert_equal 401, last_response.status
  end
end
