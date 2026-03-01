FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.unique.email }
    phone { '090-1234-5678' }
    password { 'Password123!' }
    password_confirmation { 'Password123!' }
  end
end
