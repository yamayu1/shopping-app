# 注文を作成するユースケースクラス

class CreateOrderUseCase
  def initialize(user:, address_id:, payment_method:)
    @user = user
    @address_id = address_id
    @payment_method = payment_method
  end

  def call
    # 配送先の住所を取得
    address = @user.addresses.find_by(id: @address_id)
    return { success: false, error: 'Address not found' } unless address

    # カートが空のときは注文できない
    if @user.cart.empty?
      return { success: false, error: 'Cart is empty' }
    end

    # 在庫が足りない商品が1つでもあれば注文を中止
    @user.cart.cart_items.each do |item|
      unless item.product.can_purchase?(item.quantity)
        return { success: false, error: "Insufficient stock for #{item.product.name}" }
      end
    end

    # 在庫減算と注文作成は「全部成功 or 全部失敗」にする必要があるのでトランザクションでまとめて実行
    order = nil
    ActiveRecord::Base.transaction do
      @user.cart.cart_items.each do |item|
        unless item.product.reduce_stock(item.quantity)
          raise ActiveRecord::Rollback
        end
      end

      order = @user.orders.build(
        address: address,
        total_amount: @user.cart.total_price,
        payment_method: @payment_method || 'credit_card'
      )

      unless order.save
        raise ActiveRecord::Rollback
      end
    end

    if order&.persisted?
      { success: true, order: order }
    else
      { success: false, error: 'Order creation failed due to insufficient stock' }
    end
  end
end
