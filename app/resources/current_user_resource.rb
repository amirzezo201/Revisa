# frozen_string_literal: true

# The signed-in user as every page sees it. Permissions drive what the UI shows;
# the server still checks every action.
class CurrentUserResource < UserResource
  attribute :is_owner, &:owner?

  attribute :permissions do |user|
    user.owner? ? [ "*" ] : user.permission_names
  end
end
