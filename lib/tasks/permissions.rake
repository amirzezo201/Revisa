namespace :permissions do
  desc "Sync Permission::CATALOGUE into the permissions table (safe to re-run)"
  task seed: :environment do
    created = Permission.seed
    puts "Done. #{Permission.count} permissions (#{created} new)."

    if Permission.obsolete.exists?
      puts "Not in the catalogue any more: #{Permission.obsolete.pluck(:name).join(", ")}. Run permissions:cleanup_obsolete to remove them."
    end
  end

  desc "Create the default roles from Role::Templates. Admin is always re-synced; curated roles are left alone (safe to re-run)"
  task seed_roles: :seed do
    Role.seed.each { |role| puts "#{role.name}: #{role.permissions.count} permissions" }
  end

  desc "Delete permissions that are no longer in Permission::CATALOGUE"
  task cleanup_obsolete: :environment do
    Permission.obsolete.find_each do |permission|
      puts "Removing #{permission.name} (roles: #{permission.roles.pluck(:name).presence&.to_sentence || "none"})"
      permission.destroy!
    end
  end

  desc "Make the user with EMAIL the owner: bin/rails 'permissions:make_owner[a@b.com]'"
  task :make_owner, [ :email ] => :environment do |_task, args|
    abort "Usage: bin/rails 'permissions:make_owner[email@example.com]'" if args[:email].blank?

    user = User.find_by(email: args[:email].strip.downcase) || abort("No user with email #{args[:email]}")
    previous = Ownership.owner
    Ownership.transfer_to!(user)
    puts "Owner: #{previous&.email || "(none)"} -> #{user.email}"
  end
end
