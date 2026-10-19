---
name: review-workflow
description: >-
  Revisa's review and hand-off loop as CRUD state records: Submission (submit
  for review), Review (approve / request changes, one approval is enough),
  Comment (anchored to a section, internal vs client-visible) + Resolution,
  Publication (mark as built in WordPress), Events timeline and email
  notifications. Use when adding or changing any review transition, comments,
  approvals, "mark as built", export, the dashboard queues, or notifications.
  WHEN NOT: Creating revisions (use content-versioning / word-import), diff
  output (use content-diff), permission plumbing (use permissions).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, Solid Queue, Inertia Rails + React
---

# Review workflow

Phases 2 and 3 of `docs/plans/content-versioning.md`. These aren't built yet; follow this design. General pattern: the `state-records` skill.

## State records

| Record | Belongs to | Meaning | Route | Permission |
|---|---|---|---|---|
| `Submission` | revision (has_one) | "vN is up for review" | `POST /revisions/:id/submission` | `submissions.create` |
| `Review` | revision (has_many) | verdict `approved` / `changes_requested` + note | `POST /revisions/:id/reviews` | `reviews.approve` / `reviews.request_changes` |
| `Comment` | revision | feedback on `section_key` (+ `quoted_text`) | `POST /revisions/:id/comments` | `comments.create` / `comments.create_internal` |
| `Resolution` | comment (has_one) | comment resolved | `POST /comments/:id/resolution` (DELETE reopens) | `comments.resolve` |
| `Publication` | page + revision | "vN built in WordPress at <url>" | `POST /pages/:id/publications` | `publications.create` |

There are no booleans like `approved`, `resolved`, `published` or `submitted`. `Page#status` is derived from these records (see `revisa-domain`).

## Models

```ruby
class Submission < ApplicationRecord
  belongs_to :revision # no touch: revisions are readonly
  belongs_to :submitter, class_name: "User", default: -> { Current.user }

  after_create_commit :notify_reviewers_later
  after_create_commit -> { revision.page.record_event(:submitted, self) }

  def notify_reviewers_later = Submission::NotifyReviewersJob.perform_later(self)

  def notify_reviewers_now
    revision.page.site.users_with_permission("reviews.approve").each do |user|
      ReviewMailer.with(submission: self, recipient: user).ready_for_review.deliver_now
    end
  end
end

class Review < ApplicationRecord
  VERDICTS = %w[ approved changes_requested ].freeze

  belongs_to :revision
  belongs_to :reviewer, class_name: "User", default: -> { Current.user }

  validates :verdict, inclusion: { in: VERDICTS }
  validates :note, presence: true, if: -> { verdict == "changes_requested" }

  scope :approved, -> { where(verdict: "approved") }
end

class Revision < ApplicationRecord
  has_one :submission, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_many :comments, dependent: :destroy

  scope :approved, -> { where(id: Review.approved.select(:revision_id)) }

  def approved? = reviews.approved.exists?        # one approval is enough
  def changes_requested? = reviews.order(:created_at).last&.verdict == "changes_requested"
end

class Publication < ApplicationRecord
  belongs_to :page, touch: true
  belongs_to :revision
  belongs_to :publisher, class_name: "User", default: -> { Current.user }

  validate :revision_is_approved

  private
    def revision_is_approved
      errors.add(:revision, "must be approved before it can be marked as built") unless revision&.approved?
    end
end
```

Note: `Revision#readonly?` blocks updating the revision itself, and `touch: true` on a readonly parent raises. So children of a revision never use `touch: true`; when caches need busting, touch the **page** (`after_create_commit -> { revision.page.touch }`).

## Controllers (one per transition, thin)

```ruby
class Revisions::ReviewsController < InertiaController
  def create
    revision = policy_scope(Revision).find(params[:revision_id])
    review = revision.reviews.build(review_params)
    authorize review # ReviewPolicy#create? -> reviews.approve or reviews.request_changes by verdict

    if review.save
      redirect_to page_revision_path(revision.page, revision), notice: review_notice(review)
    else
      redirect_to page_revision_path(revision.page, revision), inertia: { errors: review.errors }
    end
  end

  private
    def review_params = params.expect(review: [ :verdict, :note ])
    def review_notice(review) = review.verdict == "approved" ? "v#{review.revision.number} approved" : "Changes requested"
end

class ReviewPolicy < ApplicationPolicy
  def create?
    action = record.verdict == "approved" ? :approve : :request_changes
    has_permission?(permission(action)) && site_visible?(record.revision.page.site)
  end
end
# site_visible?(site) = SitePolicy::Scope.new(user, Site).resolve.exists?(site.id), shared in ApplicationPolicy
```

To add a new transition (for example "withdraw submission"), add a new verb on an existing resource (`DELETE /revisions/:id/submission` -> `SubmissionsController#destroy`) or a new resource. **Never** add `#approve`/`#withdraw` actions. Then follow the `permissions` checklist for the new permission.

## Comments: internal vs client

- `internal: true` comments are team-only. Creating one needs `comments.create_internal`; seeing one needs `comments.view_internal`
- Filter in `CommentPolicy::Scope`:

```ruby
class CommentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      visible = scope.where(revision: RevisionPolicy::Scope.new(user, Revision).resolve)
      if has_permission?(permission(:view_internal))
        visible
      else
        visible.where(internal: false)
      end
    end
  end
end
```

- In controllers, **always** load comments via `policy_scope(revision.comments)`. Never `revision.comments` straight into a resource
- Comments anchor to `section_key`. Because keys are stable (see `word-import`), a comment on v3's `faq` still lines up with v4's `faq` in the diff view
- Open comments: `Comment.where.missing(:resolution)`

## Events (timeline)

`Page#record_event(action, eventable, **particulars)` creates `Event(page:, eventable:, action:, creator: Current.user, particulars:)`. Actions: `uploaded`, `versioned`, `restored`, `submitted`, `approved`, `changes_requested`, `commented`, `resolved`, `published`. Timeline text is rendered in React from `action` + `particulars` ("Sara uploaded v3 (Word)"). Events for internal comments must be hidden from clients too, so filter them in the events scope.

## Notifications (email, Solid Queue)

| Trigger | Recipients | Mail |
|---|---|---|
| Submission created | users who can see the site **and** have `reviews.approve` (includes clients) | "v4 is ready for review" |
| Review changes_requested | submitter + page creator | "Changes requested on v4" |
| Review approved | users with `publications.create` on the site | "v4 approved, ready to build" |
| Comment created | revision author + earlier commenters (skip internal comments for clients) | "Comment on v4" |

Always `_later` -> job -> `_now` on the model. The mailer only formats. Plain text first.

## Hand-off (phase 3)

- **Copy buttons** on an approved revision: per section "Copy HTML" / "Copy text" (`useClipboard` hook in `app/frontend/hooks/use-clipboard.ts`)
- **Export**: `GET /revisions/:id/export.html` / `.docx` -> `Revisions::ExportsController#show` (`publications.export`). The .docx is built with pandoc (`--from=html --to=docx`), meta title and description at the top, sections in order
- **Mark as built**: `POST /pages/:id/publications` with `revision_id`, `live_url`, `note`. Then the page shows `published`; after a newer approval, `needs_rebuild?` is true and links to the "since last built" comparison

## Dashboard queues

- "Waiting on me": revisions with a submission, no reviews yet, on sites I can see, if I have `reviews.approve`; plus my pages with `changes_requested`
- "Approved, needs building": latest revision approved, no publication for it
- "Needs rebuild": `needs_rebuild?`

Implement these as scopes on `Page`/`Revision`, composed with `policy_scope`.

## Tests

- Model: one approval approves; `changes_requested` needs a note; Publication rejects unapproved revisions; status derivation for each state
- Policy: a writer can't approve; a client reviewer can approve only on their own site; a client never sees internal comments
- Controller: `post revision_reviews_path(rev), params: { review: { verdict: "approved" } }` -> `follow_redirect!` -> `assert_inertia_flash notice: "v2 approved"`
- Jobs/mailers: `assert_enqueued_with(job: Submission::NotifyReviewersJob)`; recipients exclude users without site access
