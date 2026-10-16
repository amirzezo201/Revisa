# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Default user for signing in locally. Change the password (or remove this) before deploying anywhere public.
user = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.name = "Admin User"
  u.password = "Password1234!"
  u.password_confirmation = "Password1234!"
  u.verified = true
end

puts "Seeded user: #{user.email} / Password1234!" unless Rails.env.test?
