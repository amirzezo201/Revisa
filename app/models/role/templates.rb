# frozen_string_literal: true

# Starter permission sets. A new role can begin from a template (or a copy of
# another role) and is then fine-tuned in the permission picker.
module Role::Templates
  extend ActiveSupport::Concern

  Template = Data.define(:key, :name, :description, :resolver) do
    def permission_names
      resolver.call
    end

    def permissions
      Permission.where(name: permission_names)
    end

    def permissions_count
      permissions.count
    end
  end

  SEO = %w[
    sites.index sites.show sites.create sites.update
    pages.index pages.show pages.create pages.update pages.destroy
    drafts.update
    revisions.index revisions.show revisions.create revisions.import revisions.restore revisions.compare revisions.download_source
    submissions.create
    reviews.approve reviews.request_changes
    comments.create comments.create_internal comments.view_internal comments.resolve
    publications.export publications.create
  ].freeze

  WRITER = %w[
    sites.index_own sites.show
    pages.index pages.show pages.create pages.update_own
    drafts.update_own
    revisions.index revisions.show revisions.create revisions.import revisions.restore revisions.compare revisions.download_source
    submissions.create
    comments.create comments.create_internal comments.view_internal comments.resolve
    publications.export
  ].freeze

  CLIENT_REVIEWER = %w[
    sites.index_own sites.show
    pages.index pages.show
    revisions.index revisions.show revisions.compare
    reviews.approve reviews.request_changes
    comments.create
  ].freeze

  TEMPLATES = [
    Template.new(
      key: "full_access",
      name: "Full access",
      description: "Every permission, including users and sites.",
      resolver: -> { Permission.pluck(:name) }
    ),
    Template.new(
      key: "seo",
      name: "SEO",
      description: "All sites. Imports, edits and versions content, approves or requests changes, and marks pages as built.",
      resolver: -> { SEO }
    ),
    Template.new(
      key: "writer",
      name: "Writer",
      description: "Assigned sites. Edits their own pages, saves versions and submits them for review. Cannot approve.",
      resolver: -> { WRITER }
    ),
    Template.new(
      key: "client_reviewer",
      name: "Client reviewer",
      description: "Their own sites only. Reads, compares and comments, and approves or requests changes.",
      resolver: -> { CLIENT_REVIEWER }
    )
  ].freeze

  SEEDED_ROLES = {
    "Admin" => "full_access",
    "SEO" => "seo",
    "Writer" => "writer",
    "Client Reviewer" => "client_reviewer"
  }.freeze

  class_methods do
    def templates
      TEMPLATES
    end

    def template(key)
      TEMPLATES.find { |template| template.key == key.to_s }
    end

    def template!(key)
      template(key) || raise(ArgumentError, "Unknown role template: #{key}")
    end

    # Admin is always re-synced to every permission. The other roles are only
    # filled while empty: once curated, re-running must not widen or narrow them.
    def seed
      SEEDED_ROLES.map do |name, key|
        role = find_or_create_by!(name: name)

        if name == "Admin" || role.permissions.empty?
          role.apply_template(key).save!
        end

        role
      end
    end
  end

  def apply_template(key)
    template = Role.template!(key)
    self.permissions = template.permissions
    self.description = template.description if description.blank?
    self
  end

  def copy_permissions_from(other)
    self.permissions = other.permissions
    self
  end
end
