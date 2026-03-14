require 'test_helper'

class ProductsControllerTest < Minitest::Test
  def setup
    super
    @category = create(:category)
    @product = create(:product, category: @category, stock_quantity: 10, status: :active)
    @inactive_product = create(:product, :inactive, category: @category)
    @out_of_stock_product = create(:product, :out_of_stock, category: @category)
  end

  # GET /api/products
  def test_get_products_list
    get '/api/products'

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
    assert_instance_of Array, response[:data]
    assert_operator response[:data].length, :>, 0
  end

  def test_get_products_with_pagination
    create_list(:product, 15, category: @category)

    get '/api/products?page=1&per_page=10'

    assert_equal 200, last_response.status
    response = json_response
    assert_equal 10, response[:data].length
    assert_not_nil response[:pagination]
    assert_equal 1, response[:pagination][:current_page]
  end

  def test_get_products_filter_by_category
    category2 = create(:category)
    create_list(:product, 3, category: category2)

    get "/api/products?category_id=#{@category.id}"

    assert_equal 200, last_response.status
    response = json_response
    response[:data].each do |product|
      assert_equal @category.id, product[:category_id]
    end
  end

  def test_get_products_filter_in_stock_only
    get '/api/products?in_stock=true'

    assert_equal 200, last_response.status
    response = json_response
    response[:data].each do |product|
      assert_operator product[:stock_quantity], :>, 0
    end
  end

  def test_get_products_search_by_name
    searchable_product = create(:product, name: 'Special Product Name', category: @category)

    get '/api/products?search=Special'

    assert_equal 200, last_response.status
    response = json_response
    product_names = response[:data].map { |p| p[:name] }
    assert_includes product_names, searchable_product.name
  end

  def test_get_products_sort_by_price_asc
    cheap_product = create(:product, price: 100, category: @category)
    expensive_product = create(:product, price: 1000, category: @category)

    get '/api/products?sort_by=price&sort_order=asc'

    assert_equal 200, last_response.status
    response = json_response
    prices = response[:data].map { |p| p[:price] }
    assert_equal prices, prices.sort
  end

  def test_get_products_sort_by_price_desc
    create(:product, price: 100, category: @category)
    create(:product, price: 1000, category: @category)

    get '/api/products?sort_by=price&sort_order=desc'

    assert_equal 200, last_response.status
    response = json_response
    prices = response[:data].map { |p| p[:price] }
    assert_equal prices, prices.sort.reverse
  end

  # GET /api/products/:id
  def test_get_product_detail
    get "/api/products/#{@product.id}"

    assert_equal 200, last_response.status
    response = json_response
    assert_equal true, response[:success]
    assert_equal @product.id, response[:data][:id]
    assert_equal @product.name, response[:data][:name]
    assert_not_nil response[:data][:category]
  end

  def test_get_nonexistent_product
    get '/api/products/99999'

    assert_equal 404, last_response.status
    response = json_response
    assert_equal false, response[:success]
  end

  def test_get_inactive_product_detail
    get "/api/products/#{@inactive_product.id}"

    # 非アクティブな商品でも詳細ページでは表示できること
    assert_equal 200, last_response.status
    response = json_response
    assert_equal @inactive_product.id, response[:data][:id]
  end

  # GET /api/products/featured
  def test_get_featured_products
    featured_product = create(:product, featured: true, category: @category)
    regular_product = create(:product, featured: false, category: @category)

    get '/api/products/featured'

    assert_equal 200, last_response.status
    response = json_response
    product_ids = response[:data].map { |p| p[:id] }
    assert_includes product_ids, featured_product.id
    refute_includes product_ids, regular_product.id
  end

  # エッジケース
  def test_get_products_with_invalid_page
    get '/api/products?page=invalid'

    # 正しく処理し、デフォルトでページ1にする
    assert_equal 200, last_response.status
  end

  def test_get_products_with_negative_per_page
    get '/api/products?per_page=-10'

    # 正しく処理し、デフォルト値を使用する
    assert_equal 200, last_response.status
  end

  def test_get_products_empty_category
    empty_category = create(:category)
    get "/api/products?category_id=#{empty_category.id}"

    assert_equal 200, last_response.status
    response = json_response
    assert_equal 0, response[:data].length
  end
end
