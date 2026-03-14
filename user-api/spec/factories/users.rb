FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'password123' }
    first_name { 'John' }
    last_name { 'Doe' }
    phone { '090-1234-5678' }
    birth_date { '1990-01-01' }
    
    trait :with_address do
      after(:create) do |user|
        create(:address, user: user, is_default: true)
      end
    end
    
    trait :with_cart_items do
      after(:create) do |user|
        product = create(:product)
        user.cart.add_item(product, 2)
      end
    end
  end
end