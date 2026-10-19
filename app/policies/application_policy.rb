# frozen_string_literal: true

# Maps the standard actions to "<resource>.<action>" permissions, so
# PagePolicy#update? checks "pages.update". Custom actions add their own methods.
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    has_permission?(permission(:index))
  end

  def show?
    has_permission?(permission(:show))
  end

  def create?
    has_permission?(permission(:create))
  end

  def new?
    create?
  end

  def update?
    has_permission?(permission(:update))
  end

  def edit?
    update?
  end

  def destroy?
    has_permission?(permission(:destroy))
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      raise NotImplementedError, "You must define #resolve in #{self.class}"
    end

    private
      attr_reader :user, :scope

      def permission(action)
        "#{self.class.name.delete_suffix("Policy::Scope").underscore.pluralize}.#{action}"
      end

      def has_permission?(name)
        user.has_permission?(name)
      end
  end

  private
    def permission(action)
      "#{self.class.name.delete_suffix("Policy").underscore.pluralize}.#{action}"
    end

    def has_permission?(name)
      user.has_permission?(name)
    end
end
