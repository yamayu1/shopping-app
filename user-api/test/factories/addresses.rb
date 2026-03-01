FactoryBot.define do
  factory :address do
    association :user
    name { Faker::Name.name }
    postal_code { "#{rand(100..999)}-#{rand(1000..9999)}" }
    state { Faker::Address.state }
    city { Faker::Address.city }
    address_line_1 { Faker::Address.street_address }
    address_line_2 { Faker::Address.secondary_address }
    phone { '090-1234-5678' }
    is_default { false }

    trait :default do
      is_default { true }
    end

    trait :without_line2 do
      address_line_2 { nil }
    end
  end
end
