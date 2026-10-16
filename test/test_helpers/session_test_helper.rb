module SessionTestHelper
  def self.signed_cookie(name, value)
    cookie_jar = ActionDispatch::Request.new(Rails.application.env_config.deep_dup).cookie_jar
    cookie_jar.signed[name] = value
    cookie_jar[name]
  end

  def sign_in(user)
    session = user.sessions.create!
    cookies[:session_id] = SessionTestHelper.signed_cookie(:session_id, session.id)
  end

  def sign_out
    cookies[:session_id] = ""
  end
end
