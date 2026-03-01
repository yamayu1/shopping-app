FactoryBot.define do
  factory :cart do
    association :user

    trait :with_items do
      after(:create) do |cart|
        create_list(:cart_item, 2, cart: cart)
      end
    end
  end
end
