require 'test_helper'

class ProductTest < Minitest::Test
  def setup
    super
    @category = create(:category)
    @product = build(:product, category: @category)
  end

  # バリデーション
  def test_valid_product
    assert @product.valid?
  end

  def test_name_presence
    @product.name = nil
    refute @product.valid?
  end

  def test_description_presence
    @product.description = nil
    refute @product.valid?
  end

  def test_price_presence
    @product.price = nil
    refute @product.valid?
  end

  def test_price_greater_than_zero
    @product.price = 0
    refute @product.valid?

    @product.price = -10
    refute @product.valid?

    @product.price = 100
    assert @product.valid?
  end

  def test_stock_quantity_presence
    @product.stock_quantity = nil
    refute @product.valid?
  end

  def test_stock_quantity_non_negative
    @product.stock_quantity = -1
    refute @product.valid?

    @product.stock_quantity = 0
    assert @product.valid?
  end

  def test_sku_presence
    @product.sku = nil
    refute @product.valid?
  end

  def test_sku_uniqueness
    product1 = create(:product, sku: 'SKU-12345')
    product2 = build(:product, sku: 'SKU-12345')
    refute product2.valid?
  end

  # アソシエーション
  def test_belongs_to_category
    assert_respond_to @product, :category
  end

  # インスタンスメソッド
  def test_in_stock_with_stock_and_active
    product = create(:product, stock_quantity: 10, status: :active)
    assert product.in_stock?
  end

  def test_in_stock_with_no_stock
    product = create(:product, :out_of_stock, status: :active)
    refute product.in_stock?
  end

  def test_in_stock_with_inactive_status
    product = create(:product, :inactive, stock_quantity: 10)
    refute product.in_stock?
  end

  def test_can_purchase_with_sufficient_stock
    product = create(:product, stock_quantity: 10, status: :active)
    assert product.can_purchase?(5)
    assert product.can_purchase?(10)
    refute product.can_purchase?(11)
  end

  def test_can_purchase_with_inactive_product
    product = create(:product, :inactive, stock_quantity: 10)
    refute product.can_purchase?(5)
  end

  def test_reduce_stock_success
    product = create(:product, stock_quantity: 10)
    result = product.reduce_stock(5)

    assert result
    assert_equal 5, product.reload.stock_quantity
  end

  def test_reduce_stock_insufficient_quantity
    product = create(:product, stock_quantity: 5)
    result = product.reduce_stock(10)

    refute result
    assert_equal 5, product.reload.stock_quantity
  end

  def test_reduce_stock_with_concurrent_purchase
    product = create(:product, stock_quantity: 10)

    # スレッドを使って同時購入をシミュレーション
    threads = 3.times.map do
      Thread.new do
        product.reduce_stock(4)
      end
    end

    threads.each(&:join)

    # 2回の購入のみ成功するはず（10 / 4 = 2 余りあり）
    assert_operator product.reload.stock_quantity, :>=, 0
    assert_operator product.stock_quantity, :<=, 10
  end

  # スコープ
  def test_active_scope
    active_product = create(:product, status: :active)
    inactive_product = create(:product, :inactive)

    active_products = Product.active
    assert_includes active_products, active_product
    refute_includes active_products, inactive_product
  end

  def test_in_stock_scope
    in_stock_product = create(:product, stock_quantity: 10)
    out_of_stock_product = create(:product, :out_of_stock)

    in_stock_products = Product.in_stock
    assert_includes in_stock_products, in_stock_product
    refute_includes in_stock_products, out_of_stock_product
  end

  def test_by_category_scope
    category1 = create(:category)
    category2 = create(:category)
    product1 = create(:product, category: category1)
    product2 = create(:product, category: category2)

    products = Product.by_category(category1.id)
    assert_includes products, product1
    refute_includes products, product2
  end

  def test_search_by_name_scope
    product1 = create(:product, name: 'Amazing Product')
    product2 = create(:product, name: 'Different Item')

    products = Product.search_by_name('Amazing')
    assert_includes products, product1
    refute_includes products, product2
  end

  # Enum定義
  def test_status_enum
    product = create(:product)

    assert product.active?
    product.inactive!
    assert product.inactive?
    product.discontinued!
    assert product.discontinued?
  end
end
