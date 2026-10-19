# frozen_string_literal: true

# Everything that can be gated, named "resource.action". The catalogue below is the
# source of truth: `bin/rails permissions:seed` writes it to the table, and roles
# and direct user grants point at the rows.
class Permission < ApplicationRecord
  CATALOGUE = {
    "sites" => {
      "index" => "View all sites",
      "index_own" => "View sites they have been given access to",
      "show" => "View site details",
      "create" => "Create sites",
      "update" => "Edit sites",
      "destroy" => "Delete sites",
      "manage_access" => "Choose which users can see a site"
    },
    "pages" => {
      "index" => "View pages on visible sites",
      "show" => "View page details",
      "create" => "Create pages",
      "update" => "Edit any page's details",
      "update_own" => "Edit details of pages they created",
      "destroy" => "Delete pages"
    },
    "drafts" => {
      "update" => "Edit the working draft of any page",
      "update_own" => "Edit the working draft of pages they created"
    },
    "revisions" => {
      "index" => "View version history",
      "show" => "View a version",
      "create" => "Save the draft as a new version",
      "import" => "Upload a Word document as a new version",
      "restore" => "Restore an old version into the draft",
      "compare" => "Compare two versions",
      "download_source" => "Download the original Word document"
    },
    "submissions" => {
      "create" => "Submit a version for review"
    },
    "reviews" => {
      "approve" => "Approve a version",
      "request_changes" => "Request changes on a version"
    },
    "comments" => {
      "create" => "Comment on a version",
      "create_internal" => "Write internal comments clients cannot see",
      "view_internal" => "See internal comments",
      "resolve" => "Resolve comments",
      "destroy" => "Delete comments"
    },
    "publications" => {
      "export" => "Copy and export approved content",
      "create" => "Mark an approved version as built in WordPress"
    },
    "users" => {
      "index" => "View all users",
      "show" => "View user details",
      "create" => "Invite users",
      "update" => "Edit users",
      "destroy" => "Delete users",
      "assign_role" => "Change a user's role"
    }
  }.freeze

  has_many :role_permissions, dependent: :destroy
  has_many :roles, through: :role_permissions
  has_many :user_permissions, dependent: :destroy
  has_many :users, through: :user_permissions

  validates :name, presence: true, uniqueness: true
  validates :resource, :action, presence: true

  class << self
    # Safe to re-run: creates missing rows and refreshes descriptions. Returns the
    # number of rows created.
    def seed
      CATALOGUE.sum do |resource, actions|
        actions.count do |action, description|
          permission = find_or_initialize_by(name: "#{resource}.#{action}")
          created = permission.new_record?
          permission.update!(resource: resource, action: action, description: description)
          created
        end
      end
    end

    def catalogue
      order(:resource, :action).group_by(&:resource).transform_values do |permissions|
        permissions.map { |permission| permission.slice(:id, :name, :resource, :action, :description) }
      end
    end

    # Rows in the table that the catalogue no longer lists. They gate nothing.
    def obsolete
      where.not(name: CATALOGUE.flat_map { |resource, actions| actions.keys.map { |action| "#{resource}.#{action}" } })
    end
  end
end
