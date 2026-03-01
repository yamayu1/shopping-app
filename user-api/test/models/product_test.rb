require 'test_helper'

class ProductTest < ActiveSupport::TestCase
  def setup
    @category = create(:category)
    @product = build(:product, category: @category)
  end

  def test_valid_product
    assert @product.valid?
  end

  def test_name_is_required
    @product.name = nil
    refute @product.valid?
  end

  def test_active_scope
    active = create(:product, status: :active)
    inactive = create(:product, :inactive)

    assert_includes Product.active, active
    refute_includes Product.active, inactive
  end

  def test_in_stock_method
    product = create(:product, stock_quantity: 10, status: :active)
    assert product.in_stock?

    product.update(stock_quantity: 0)
    refute product.in_stock?
  end
end
