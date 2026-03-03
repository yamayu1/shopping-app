require 'test_helper'

class ProductsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @category = create(:category)
    @product = create(:product, category: @category, stock_quantity: 10, status: :active)
  end

  def test_products_index
    get '/api/products', headers: { 'Content-Type' => 'application/json' }

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
    assert data[:data][:products].is_a?(Array)
  end

  def test_get_product_detail
    get "/api/products/#{@product.id}", headers: { 'Content-Type' => 'application/json' }

    assert_equal 200, response.status
    data = json_response
    assert_equal true, data[:success]
    assert_equal @product.id, data[:data][:product][:id]
  end

  def test_search_products
    searchable = create(:product, name: 'UniqueSearchName', category: @category, status: :active)

    get '/api/products?search=UniqueSearchName', headers: { 'Content-Type' => 'application/json' }

    assert_equal 200, response.status
    data = json_response
    names = data[:data][:products].map { |p| p[:name] }
    assert_includes names, searchable.name
  end
end
