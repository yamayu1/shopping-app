class ProductsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show, :search, :categories, :featured]

  # 商品一覧。フィルターとページネーション付き
  def index
    @products = Product.active.includes(:category)

    # カテゴリや検索条件があれば絞り込む
    @products = @products.by_category(params[:category_id]) if params[:category_id].present?
    @products = @products.search_by_name(params[:search]) if params[:search].present?
    @products = @products.in_stock if params[:in_stock] == 'true'
    @products = @products.where('price >= ?', params[:min_price].to_f) if params[:min_price].present?
    @products = @products.where('price <= ?', params[:max_price].to_f) if params[:max_price].present?
    @products = @products.where(is_featured: true) if params[:is_featured] == 'true' || params[:featured] == 'true'

    # ソート
    if params[:sort_by].present?
      allowed_sort = %w[price name created_at]
      sort_column = allowed_sort.include?(params[:sort_by]) ? params[:sort_by] : 'created_at'
      sort_order = params[:sort_order] == 'asc' ? 'asc' : 'desc'
      @products = @products.order("#{sort_column} #{sort_order}")
    else
      @products = @products.order(created_at: :desc)
    end

    @products = @products.page(params[:page]).per(params[:per_page] || 20)

    render_success({
      products: @products.map { |product| product_data(product) },
      pagination: pagination_data(@products)
    })
  end

  def show
    @product = Product.active.includes(:category).find(params[:id])

    render_success({
      product: product_data(@product, detailed: true)
    })
  end

  def search
    query = params[:q]
    return render_error('Search query is required', :bad_request) if query.blank?

    @products = Product.active
                      .includes(:category)
                      .search_by_name(query)
                      .page(params[:page])
                      .per(params[:per_page] || 20)

    render_success({
      products: @products.map { |product| product_data(product) },
      pagination: pagination_data(@products),
      query: query
    })
  end

  # トップページに表示するおすすめ商品
  def featured
    limit = params[:limit] || 8
    @products = Product.active
                      .where(is_featured: true)
                      .includes(:category)
                      .limit(limit)

    render_success({
      products: @products.map { |product| product_data(product) }
    })
  end

  def categories
    @categories = Category.active.includes(:products)

    render_success({
      categories: @categories.map do |category|
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          products_count: category.products.active.count
        }
      end
    })
  end

  private

  def pagination_data(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total: collection.total_count,
      per_page: collection.limit_value
    }
  end

  def product_data(product, detailed: false)
    data = {
      id: product.id,
      name: product.name,
      description: detailed ? product.description : product.description.truncate(100),
      sku: product.sku,
      price: product.price.to_f,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      is_featured: product.is_featured || false,
      in_stock: product.in_stock?,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      },
      images: product.images || [],
      created_at: product.created_at
    }

    data
  end

end
