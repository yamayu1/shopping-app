# 注文の決済を確定するユースケースクラス
class ConfirmOrderPaymentUseCase
  def initialize(user:, order_id:)
    @user = user
    @order_id = order_id
  end

  def call
    # 自分の注文の中から該当の注文を探す
    order = @user.orders.find_by(id: @order_id)
    return { success: false, error: 'Order not found' } unless order

    if order.paid?
      return { success: false, error: 'Order already paid' }
    end

    # トランザクションIDを発行（時刻 + ランダム文字列）
    transaction_id = "TXN_#{Time.current.strftime('%Y%m%d%H%M%S')}_#{SecureRandom.hex(4).upcase}"

    order.update!(
      payment_status: :paid,
      payment_transaction_id: transaction_id,
      status: :confirmed
    )

    { success: true, order: order }
  end
end
