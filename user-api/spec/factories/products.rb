FactoryBot.define do
  factory :product do
    sequence(:name) { |n| "Product #{n}" }
    description { 'A great product description' }
    sequence(:sku) { |n| "SKU#{n.to_s.rjust(6, '0')}" }
    price { 1999.99 }
    stock_quantity { 100 }
    status { :active }
    association :category
    
    trait :out_of_stock do
      stock_quantity { 0 }
    end
    
    trait :low_stock do
      stock_quantity { 5 }
    end
    
    trait :inactive do
      status { :inactive }
    end
  end
end