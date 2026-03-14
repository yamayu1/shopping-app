FactoryBot.define do
  factory :category do
    name { Faker::Commerce.unique.department }
    description { Faker::Lorem.sentence }

    trait :with_products do
      after(:create) do |category|
        create_list(:product, 5, category: category)
      end
    end
  end
end
