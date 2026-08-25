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

  # 注文作成
  def create
    result = CreateOrderUseCase.new(
      user: current_user,
      address_id: params[:address_id],
      payment_method: params[:payment_method]
    ).call

    if result[:success]
      render_success(
        { order: order_data(result[:order], detailed: true) },
        'Order created successfully',
        :created
      )
    else
      render_error(result[:error], :bad_request)
    end
  end

  # 注文キャンセル
  def cancel
    result = CancelOrderUseCase.new(
      user: current_user,
      order_id: params[:id]
    ).call

    if result[:success]
      render_success(
        { order: order_data(result[:order], detailed: true) },
        'Order cancelled successfully'
      )
    else
      render_error(result[:error], :bad_request)
    end
  end

  # 決済確定
  def confirm_payment
    result = ConfirmOrderPaymentUseCase.new(
      user: current_user,
      order_id: params[:id]
    ).call

    if result[:success]
      render_success(
        { order: order_data(result[:order], detailed: true) },
        'Payment confirmed successfully'
      )
    else
      render_error(result[:error], :bad_request)
    end
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