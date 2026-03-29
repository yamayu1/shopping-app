class OrdersController < ApplicationController
  def index
    @orders = current_user.orders
                          .includes(:address, order_items: :product)
                          .recent
                          .page(params[:page])
                          .per(params[:per_page] || 10)
    
    render_success({
      orders: @orders.map { |order| order_data(order) },
      pagination: pagination_data(@orders)
    })
  end

  def show
    @order = current_user.orders.includes(:address, order_items: :product).find(params[:id])
    
    render_success({
      order: order_data(@order, detailed: true)
    })
  end

  # 注文作成。在庫チェック→在庫減らす→注文作成をトランザクションで囲んでる
  def create
    address = current_user.addresses.find(params[:address_id])

    if current_user.cart.empty?
      return render_error('Cart is empty', :bad_request)
    end

    # 先に在庫が足りるか確認
    current_user.cart.cart_items.each do |item|
      unless item.product.can_purchase?(item.quantity)
        return render_error("Insufficient stock for #{item.product.name}", :bad_request)
      end
    end

    ActiveRecord::Base.transaction do
      current_user.cart.cart_items.each do |item|
        unless item.product.reduce_stock(item.quantity)
          raise ActiveRecord::Rollback
        end
      end
      
      @order = current_user.orders.build(
        address: address,
        total_amount: current_user.cart.total_price,
        payment_method: params[:payment_method] || 'credit_card'
      )
      
      if @order.save
        render_success({
          order: order_data(@order, detailed: true)
        }, 'Order created successfully', :created)
      else
        render_error('Order creation failed', :unprocessable_entity, @order.errors.full_messages)
      end
    end
  rescue ActiveRecord::Rollback
    render_error('Order creation failed due to insufficient stock', :bad_request)
  end

  def cancel
    @order = current_user.orders.find(params[:id])

    if @order.cancel!
      render_success({
        order: order_data(@order.reload, detailed: true)
      }, 'Order cancelled successfully')
    else
      render_error('Order cannot be cancelled', :bad_request)
    end
  end

  def confirm_payment
    @order = current_user.orders.find(params[:id])
    
    if @order.paid?
      return render_error('Order already paid', :bad_request)
    end
    
    transaction_id = "TXN_#{Time.current.strftime('%Y%m%d%H%M%S')}_#{SecureRandom.hex(4).upcase}"

    @order.update!(
      payment_status: :paid,
      payment_transaction_id: transaction_id,
      status: :confirmed
    )

    render_success({
      order: order_data(@order, detailed: true)
    }, 'Payment confirmed successfully')
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

  def order_data(order, detailed: false)
    address = order.address
    data = {
      id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount.to_f,
      # TODO: 小計・送料・税金の計算をちゃんとする
      subtotal: order.order_items.sum { |item| item.price * item.quantity }.to_f,
      shipping_cost: 0,
      tax_amount: 0,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      created_at: order.created_at,
      shipping_address: {
        id: address.id,
        name: address.name,
        postal_code: address.postal_code,
        state: address.state,
        city: address.city,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        full_address: address.full_address,
        phone: address.phone
      },
      items: order.order_items.map do |item|
        {
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku
          },
          quantity: item.quantity,
          price: item.price.to_f,
          total: (item.price * item.quantity).to_f
        }
      end
    }

    if detailed
      data[:notes] = order.notes
      data[:payment_transaction_id] = order.payment_transaction_id
    end

    data
  end

end