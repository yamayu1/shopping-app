FactoryBot.define do
  factory :order_item do
    association :order
    association :product
    quantity { rand(1..5) }
    price { Faker::Commerce.price(range: 100..5000) }
  end
end
