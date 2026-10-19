# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

Permission.seed
Role.seed

if Rails.env.development?
  # Default owner for signing in locally.
  owner = User.find_or_create_by!(email: "admin@example.com") do |user|
    user.name = "Admin User"
    user.password = "Password1234!"
    user.verified = true
  end
  Ownership.transfer_to!(owner) if Ownership.claimable?

  puts "Seeded owner: #{owner.email} / Password1234!"
end
