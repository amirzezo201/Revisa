# frozen_string_literal: true

class InertiaController < ApplicationController
  inertia_config default_render: true
  inertia_share auth: {
        user: -> { UserResource.new(Current.user).to_h if Current.user },
        session: -> { { id: Current.session.id } if Current.session }
      }
end
