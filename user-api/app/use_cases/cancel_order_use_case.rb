# 注文をキャンセルするユースケースクラス

class CancelOrderUseCase
  def initialize(user:, order_id:)
    @user = user
    @order_id = order_id
  end

  def call
    # 自分の注文の中から該当の注文を探す（他人の注文をキャンセルできないように）
    order = @user.orders.find_by(id: @order_id)
    return { success: false, error: 'Order not found' } unless order

    # cancel! はキャンセル不可な状態（出荷済みなど）だと false を返す
    if order.cancel!
      { success: true, order: order.reload }
    else
      { success: false, error: 'Order cannot be cancelled' }
    end
  end
end
