FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.unique.email }
    phone { Faker::PhoneNumber.phone_number }
    password { 'Password123!' }
    password_confirmation { 'Password123!' }
    email_verified_at { Time.current }

    trait :unverified do
      email_verified_at { nil }
    end

    trait :deleted do
      deleted_at { Time.current }
    end

    trait :with_addresses do
      after(:create) do |user|
        create_list(:address, 2, user: user)
      end
    end

    trait :with_orders do
      after(:create) do |user|
        create_list(:order, 3, user: user)
      end
    end
  end
end
