FactoryBot.define do
  factory :order do
    association :user
    association :address
    order_number { "ORD-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}" }
    total_amount { Faker::Commerce.price(range: 100..10000) }
    status { 'pending' }
    payment_status { 'unpaid' }
    payment_method { 'credit_card' }

    trait :confirmed do
      status { 'confirmed' }
      payment_status { 'paid' }
    end

    trait :processing do
      status { 'processing' }
      payment_status { 'paid' }
    end

    trait :shipped do
      status { 'shipped' }
      payment_status { 'paid' }
    end

    trait :delivered do
      status { 'delivered' }
      payment_status { 'paid' }
    end

    trait :cancelled do
      status { 'cancelled' }
    end

    trait :with_items do
      after(:create) do |order|
        create_list(:order_item, 2, order: order)
      end
    end
  end
end
