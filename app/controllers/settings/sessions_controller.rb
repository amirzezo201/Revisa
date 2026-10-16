# frozen_string_literal: true

class Settings::SessionsController < InertiaController
  def index
    sessions = Current.user.sessions.order(created_at: :desc)

    render inertia: { sessions: SessionResource.new(sessions).to_h }
  end
end
