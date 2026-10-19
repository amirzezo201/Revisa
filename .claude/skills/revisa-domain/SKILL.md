---
name: revisa-domain
description: >-
  Revisa's domain map, glossary, derived status rules and invariants (Site,
  SiteAccess, Page, Draft, Revision, Submission, Review, Comment, Resolution,
  Publication, Event, Permission/Role/Ownership). Load FIRST for any Revisa
  feature work, or when the user mentions pages, versions, revisions, drafts,
  approvals, page status, needs_rebuild or "built in WordPress".
  WHEN NOT: Generic Rails questions with no domain impact, pure UI styling,
  or permission plumbing (use permissions), diff internals (use content-diff),
  Word parsing (use word-import).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, Inertia Rails + React
---

# Revisa domain

Source of truth: `docs/plans/content-versioning.md`. If this skill and the plan disagree, the plan wins. Update this skill when that happens.

**The problem:** SEO copy goes back and forth as Word docs. Revisa must answer in one click: which version is latest, which is approved, what changed between two versions, who changed it and why, and which approved version was built into WordPress.

## Model map

```
Site ─┬─ SiteAccess (user_id)             who may see this site with *_own permissions
      └─ Page ─┬─ Draft (has_one)          mutable working copy, autosaved
               ├─ Revision v1..vN          immutable snapshots
               │     ├─ source_document    (Active Storage, .docx, optional)
               │     ├─ Submission         (has_one)  "up for review"
               │     ├─ Reviews            (has_many) approved / changes_requested
               │     └─ Comments ── Resolution (has_one)
               ├─ Publications             "vN built in WordPress at <url>"
               └─ Events                   activity timeline
User ── Role ── RolePermission ── Permission;  User ── UserPermission ── Permission;  Ownership (singleton)
```

| Model | Key columns |
|---|---|
| `Site` | name, url |
| `SiteAccess` | site_id, user_id (unique pair) |
| `Page` | site_id, title, slug, target_keyword, secondary_keywords (json), page_type, creator_id, live_url |
| `Draft` | page_id (unique), title, meta_title, meta_description, sections (json), base_revision_id, updated_by_id |
| `Revision` | page_id, number, title, meta_title, meta_description, sections (json), change_summary, source, author_id, parent_id, content_digest |
| `Submission` | revision_id, submitter_id, note |
| `Review` | revision_id, reviewer_id, verdict (`approved`/`changes_requested`), note |
| `Comment` | revision_id, section_key, quoted_text, body, author_id, internal (bool) |
| `Resolution` | comment_id, resolver_id |
| `Publication` | page_id, revision_id, publisher_id, live_url, note |
| `Event` | page_id, eventable (poly), action, creator_id, particulars (json) |

`Comment#internal` is a visibility attribute, not business state, so a boolean is fine there. Business state (submitted, approved, resolved, built) is **always a record**.

### Sections

```ruby
{ "key" => "hero", "kind" => "heading", "heading" => "Best running shoes 2026", "body_html" => "<p>...</p>" }
```

- `kind` is one of `heading | rich_text | faq | cta | list`
- `key` is stable across revisions (renamed headings keep their key, see `word-import`). Diffs and comments anchor on it
- Order in the array is the page order. Sections line up 1:1 with Elementor blocks

## Invariants (enforce in models, cover with tests)

1. **Revisions are immutable.** `def readonly? = persisted?`. Corrections create a new revision, and so do restores (`source: "restore"`).
2. **Numbers are sequential per page**, starting at 1, with a unique index on `[page_id, number]`. Assign inside a transaction: `self.number = page.revisions.maximum(:number).to_i + 1`.
3. **No duplicate snapshots.** `content_digest` (SHA256 of the normalized versioned fields) blocks creating a revision identical to the latest one ("identical to v3").
4. **One approval approves.** A single `Review` with `verdict: "approved"` from someone with `reviews.approve` approves the revision.
5. **Only approved revisions can be marked as built.** `Publication` validates `revision.approved?`.
6. **One Draft per page.** `base_revision_id` records which revision the draft started from. If `page.latest_revision != draft.base_revision`, someone saved a version meanwhile, so warn before overwriting.
7. **`change_summary` is required** for editor-made revisions (uploads can default to "Uploaded <filename>").
8. **Visibility follows the site.** Every record is reachable only through `policy_scope`, so a client never sees another client's site.

## Derived status (never stored)

```ruby
class Page < ApplicationRecord
  def latest_revision = revisions.order(:number).last
  def latest_approved_revision = revisions.approved.order(:number).last
  def latest_publication = publications.order(:created_at).last

  def status
    revision = latest_revision

    if revision.nil?
      "draft"
    elsif latest_publication&.revision == latest_approved_revision && revision.approved?
      "published"
    elsif revision.approved?
      "approved"
    elsif revision.changes_requested?
      "changes_requested"
    elsif revision.submission.present? && revision.reviews.none?
      "in_review"
    else
      "draft"
    end
  end

  # A newer approved revision exists than the one built into WordPress
  def needs_rebuild?
    latest_publication.present? && latest_approved_revision.number > latest_publication.revision.number
  end
end
```

Interpretation: `published` requires the *latest* revision to be the approved one that was built. If v5 is in review after v4 was built, the status is `in_review`, not `published` (confirm with the user if this matters). Precedence matches the plan: `published` > `approved` > `changes_requested` > `in_review` > `draft`. `Revision#changes_requested?` means "the latest review on this revision asks for changes". Keep these as scopes/methods on `Revision` (`Revision.approved` uses `where(id: Review.approved.select(:revision_id))`). For list pages, preload (`includes(revisions: [:reviews, :submission])`) or compute in SQL. Never cache status in a column.

## Two ways to create a revision

1. **Word upload:** `POST /pages/:id/imports` -> `Revision::Import` parses the .docx -> new revision with `source: "upload"` and the .docx attached. See `word-import`.
2. **Editor:** autosave the `Draft` (`PATCH /pages/:id/draft`), then "Save as version" (`POST /pages/:id/revisions`) freezes it into a revision with `source: "editor"` and a required summary. See `content-versioning`.

## Workflow routes (all CRUD)

| Action | Route | Permission |
|---|---|---|
| Upload Word doc | `POST /pages/:id/imports` | `revisions.import` |
| Autosave draft | `PATCH /pages/:id/draft` | `drafts.update` / `drafts.update_own` |
| Save as version | `POST /pages/:id/revisions` | `revisions.create` |
| Restore into draft | `POST /revisions/:id/restoration` | `revisions.restore` |
| Submit for review | `POST /revisions/:id/submission` | `submissions.create` |
| Approve / request changes | `POST /revisions/:id/reviews` | `reviews.approve` / `reviews.request_changes` |
| Comment / resolve | `POST /revisions/:id/comments`, `POST /comments/:id/resolution` | `comments.create` / `comments.resolve` |
| Compare | `GET /pages/:id/comparison?from=3&to=5` | `revisions.compare` |
| Export | `GET /revisions/:id/export.(html\|docx)` | `publications.export` |
| Mark as built | `POST /pages/:id/publications` | `publications.create` |

## Roles (seeded templates, the owner can edit them)

The exact permission sets are in `app/models/role/templates.rb` (`SEO`, `WRITER`, `CLIENT_REVIEWER`). Seeded by `Role.seed` as Admin / SEO / Writer / Client Reviewer. Fixture users: `one` (owner), `admin`, `seo`, `two` (writer), `client` (client reviewer), `no_role`.


- **Admin** (`full_access`): everything
- **SEO** (`seo`): all sites. Create pages, import, edit, version, submit, approve or request changes, internal comments, export, mark as built
- **Writer** (`writer`): assigned sites (via `SiteAccess`). Create pages, edit **their own** pages and drafts, import, version, restore, submit, comment (internal too), compare, export. Can't approve
- **Client Reviewer** (`client_reviewer`): own sites only. View, compare, comment (non-internal), approve or request changes

## Phases

0. Foundations: `.claude` config and the permissions port
1. Versioning core: Site, SiteAccess, Page, Draft, Revision, Word import, save as version, history, restore, diff and comparison
2. Review loop: Submission, Review, client access, Comment/Resolution, Events, email notifications, dashboard queues
3. Hand-off: copy buttons, HTML/.docx export, Publication, `needs_rebuild`, the "since last built" diff

## Related skills

`permissions` · `content-versioning` · `word-import` · `content-diff` · `review-workflow` · `inertia-feature` · `state-records`
