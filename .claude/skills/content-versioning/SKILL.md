---
name: content-versioning
description: >-
  Drafts and immutable revisions in Revisa: autosaving the Draft, "save as
  version", restoring an old revision into the draft, conflict detection via
  base_revision_id, content_digest dedupe, sequential numbering, and adding a
  new versioned field. Use when touching Draft, Revision, the page editor,
  version history, restore, or when adding a field that must be versioned
  (title, meta, sections, keywords).
  WHEN NOT: Parsing Word files (use word-import), computing diffs (use
  content-diff), approvals/comments (use review-workflow).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, SQLite json columns
---

# Content versioning

Core idea: **drafts are mutable, revisions are immutable.** This feature isn't built yet. The code below is the intended design from `docs/plans/content-versioning.md`, so follow it.

## Versioned fields

These live on both `Draft` and `Revision`:

```ruby
# app/models/concerns/versioned_content.rb
module VersionedContent
  extend ActiveSupport::Concern

  FIELDS = %w[ title meta_title meta_description sections ].freeze

  included do
    validates :title, presence: true
    validate :sections_are_well_formed
  end

  def versioned_attributes
    attributes.slice(*FIELDS)
  end

  def compute_content_digest
    Digest::SHA256.hexdigest(JSON.generate(normalized_versioned_attributes))
  end

  private
    def normalized_versioned_attributes
      versioned_attributes.merge("sections" => sections.map { _1.slice("key", "kind", "heading", "body_html") })
    end

    def sections_are_well_formed
      # each section has key, kind (heading|rich_text|faq|cta|list), heading, body_html; keys unique
    end
end
```

## Adding a new versioned field (checklist)

Example: versioning `target_keyword` per revision.

1. **Migration**: add the column to **both** `drafts` and `revisions`
2. **`VersionedContent::FIELDS`**: add it, which puts it in `versioned_attributes` and **the digest** automatically
3. **Save as version / restore / import**: these copy `versioned_attributes`, so check that nothing slices fields by hand
4. **`Revision::Import`**: if the field can come from a Word metadata line, map it (see `word-import`)
5. **`Revision::Diff`**: add a field-level change (see `content-diff`). Add a SERP length check if it's shown in search results
6. **Export** (HTML/.docx): include it if the person building the page needs it
7. **Alba resources**: `DraftResource`, `RevisionResource`, plus the TS types in `app/frontend/types`
8. **Tests**: digest changes when the field changes; the diff reports it; restore copies it

If any of these steps is skipped, the field silently disappears from history or diffs.

## Revision: immutable, numbered, deduped

```ruby
class Revision < ApplicationRecord
  include VersionedContent

  SOURCES = %w[ upload editor restore ].freeze

  belongs_to :page, touch: true
  belongs_to :author, class_name: "User", default: -> { Current.user }
  belongs_to :parent, class_name: "Revision", optional: true
  has_one_attached :source_document

  validates :source, inclusion: { in: SOURCES }
  validates :change_summary, presence: true, if: -> { source == "editor" }
  validate :differs_from_latest, on: :create

  before_create :assign_number, :assign_digest

  def readonly? = persisted?

  private
    def assign_number
      self.parent ||= page.latest_revision
      self.number = page.revisions.maximum(:number).to_i + 1
    end

    def assign_digest
      self.content_digest = compute_content_digest
    end

    def differs_from_latest
      latest = page.latest_revision
      if latest && latest.content_digest == compute_content_digest
        errors.add(:base, "Identical to v#{latest.number}")
      end
    end
end
```

- The unique index on `[page_id, number]` is the real guard against races. Create revisions inside `page.with_lock { ... }`
- `readonly?` makes `update`/`destroy` raise. Never bypass it with `update_columns`
- Active Storage attaching after create is fine (attachments aren't columns)

## Draft: one per page, autosaved

```ruby
class Draft < ApplicationRecord
  include VersionedContent

  belongs_to :page, touch: true
  belongs_to :base_revision, class_name: "Revision", optional: true
  belongs_to :updated_by, class_name: "User", default: -> { Current.user }

  def stale? = page.latest_revision != base_revision
end
```

- `Page` creates its draft lazily: `def draft = super || create_draft!(base_revision: latest_revision, **(latest_revision&.versioned_attributes || {}))`
- Autosave: `PATCH /pages/:id/draft` -> `Pages::DraftsController#update` -> `draft.update(draft_params)`. On the React side, `useForm` + a debounced `form.patch(pageDraftPath(page.id), { preserveScroll: true, preserveState: true })`
- **Conflict detection:** the client sends the `base_revision_id` it loaded. If `draft.stale?` (someone saved vN+1 meanwhile), return an error prop and show "v5 was saved by Sara while you were editing. Review the changes before saving." Never silently overwrite

## Save as version

```ruby
class Page < ApplicationRecord
  def save_draft_as_revision!(change_summary:, author: Current.user)
    with_lock do
      revision = revisions.create!(draft.versioned_attributes.merge(source: "editor", change_summary:, author:))
      draft.update!(base_revision: revision)
      revision
    end
  end
end
```

`POST /pages/:id/revisions` -> `Pages::RevisionsController#create`: `authorize page, :create_revision?` (permission `revisions.create`), call the method, then `redirect_to page_revision_path(...)`, notice: "Saved as v#{revision.number}". On `ActiveRecord::RecordInvalid` ("Identical to v3"), redirect back with `inertia: { errors: }`.

## Restore

Restoring **never** rewinds history. It copies an old revision into the draft, and the user then saves it as a new version (or it saves immediately as `source: "restore"`, depending on the UI decision. The default is copy into the draft).

```ruby
class Revision < ApplicationRecord
  def restore_into_draft!(by: Current.user)
    page.draft.update!(versioned_attributes.merge(base_revision: page.latest_revision, updated_by: by))
  end
end
```

Route: `POST /revisions/:id/restoration` -> `Revisions::RestorationsController#create` (permission `revisions.restore`). Record an `Event` (`action: "restored"`, `particulars: { from_number: }`).

## Events

Every version-creating action records an `Event` on the page: `uploaded` (with filename), `versioned`, `restored`. Keep it in the model method (or an `after_create_commit` in an `Eventable` concern), not in the controller.

## Tests (test/models/revision_test.rb, draft_test.rb, page_test.rb)

```ruby
test "revisions are immutable" do
  assert_raises(ActiveRecord::ReadOnlyRecord) { revisions(:acme_home_v1).update!(title: "x") }
end

test "numbers are sequential per page" do
  revision = pages(:acme_home).save_draft_as_revision!(change_summary: "Tweak intro", author: users(:seo))
  assert_equal pages(:acme_home).revisions.maximum(:number), revision.number
end

test "identical content is rejected" do
  page = pages(:acme_home)
  page.draft.update!(page.latest_revision.versioned_attributes)
  error = assert_raises(ActiveRecord::RecordInvalid) { page.save_draft_as_revision!(change_summary: "noop") }
  assert_match "Identical to v", error.message
end

test "draft is stale when someone saved a newer version" do
  # draft with base_revision v1 while v2 exists
  assert drafts(:acme_home).stale?
end
```

Fixtures: write `sections` as JSON in YAML (`sections: <%= [{ key: "hero", kind: "heading", heading: "Hi", body_html: "<p>Hi</p>" }].to_json %>`) and set `number` and `content_digest` explicitly.
