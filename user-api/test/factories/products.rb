FactoryBot.define do
  factory :product do
    association :category
    name { Faker::Commerce.product_name }
    description { Faker::Lorem.paragraph }
    price { Faker::Commerce.price(range: 100..10000) }
    sku { "SKU-#{Faker::Alphanumeric.unique.alphanumeric(number: 8).upcase}" }
    stock_quantity { rand(10..100) }
    status { :active }

    trait :inactive do
      status { :inactive }
    end

    trait :out_of_stock do
      stock_quantity { 0 }
    end

    trait :discontinued do
      status { :discontinued }
    end
  end
end
