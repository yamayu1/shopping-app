FactoryBot.define do
  factory :category do
    name { Faker::Commerce.unique.department }
    description { Faker::Lorem.sentence }
    slug { Faker::Internet.unique.slug }
    active { true }

    trait :inactive do
      active { false }
    end

    trait :with_products do
      after(:create) do |category|
        create_list(:product, 5, category: category)
      end
    end
  end
end
