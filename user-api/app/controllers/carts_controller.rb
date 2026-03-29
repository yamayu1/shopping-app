class CartsController < ApplicationController
  def show
    render_success({
      cart: cart_data(current_user.cart)
    })
  end

  # カートに商品を追加
  def add_item
    product = Product.find(params[:product_id])
    quantity = params[:quantity].to_i
    
    if quantity <= 0
      return render_error('Quantity must be greater than 0', :bad_request)
    end
    
    if current_user.cart.add_item(product, quantity)
      render_success({
        cart: cart_data(current_user.cart.reload)
      }, 'Item added to cart')
    else
      render_error('Unable to add item to cart. Check stock availability.', :bad_request)
    end
  end

  def update_item
    product = Product.find(params[:product_id])
    quantity = params[:quantity].to_i
    
    if current_user.cart.update_item(product, quantity)
      render_success({
        cart: cart_data(current_user.cart.reload)
      }, 'Cart updated')
    else
      render json: { error: "Unable to update cart item. Check stock availability." }, status: :bad_request
    end
  end

  def remove_item
    product = Product.find(params[:product_id])
    
    current_user.cart.remove_item(product)
    
    render_success({
      cart: cart_data(current_user.cart.reload)
    }, 'Item removed from cart')
  end

  def destroy
    current_user.cart.clear
    
    render_success({
      cart: cart_data(current_user.cart.reload)
    }, 'Cart cleared')
  end

  private

  def cart_data(cart)
    {
      id: cart.id,
      items: cart.cart_items.includes(:product).map do |item|
        {
          id: item.id,
          product_id: item.product_id,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price.to_f,
            sku: item.product.sku,
            stock_quantity: item.product.stock_quantity,
            is_active: item.product.active?,
            main_image: item.product.main_image&.url
          },
          quantity: item.quantity,
          price: item.product.price.to_f,
          subtotal: item.subtotal.to_f
        }
      end,
      total_items: cart.total_items,
      total_price: cart.total_price.to_f
    }
  end
end