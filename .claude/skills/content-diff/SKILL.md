---
name: content-diff
description: >-
  Revisa's diff engine and comparison UI: Revision#diff_against returning a
  Revision::Diff PORO, section matching by key (added / removed / changed /
  unchanged / moved), word-level diffs with diff-lcs, field-level changes with
  SERP length checks, the summary line, the Alba diff resource and the React
  diff viewer (inline / side-by-side, hide unchanged, "vs previous", "since
  last approved", "since last built"). Use when touching comparisons, the
  import preview diff, or anything that shows what changed between versions.
  WHEN NOT: Creating revisions (use content-versioning), parsing Word (use
  word-import), approval flow (use review-workflow).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, diff-lcs gem, Nokogiri, React 19
---

# Content diff

Not built yet. This is the design from `docs/plans/content-versioning.md`, under "What changed: the diff engine". **All diffing happens on the server.** React only renders ops.

Add `gem "diff-lcs"` to the Gemfile when you implement this (it's not a direct dependency yet).

## API

```ruby
diff = revision_v5.diff_against(revision_v3)   # "what changed from v3 to v5"
diff.sections        # => [Revision::Diff::Section, ...] in the order of the newer revision (removed ones placed where they were)
diff.fields          # => [Revision::Diff::Field, ...] title, meta_title, meta_description (+ keywords if versioned)
diff.summary         # => "2 sections changed, 1 added, meta description changed, +84 / −31 words"
diff.words_added     # => 84
diff.words_removed   # => 31
diff.unchanged?      # => true when nothing differs
```

`Revision::Diff` is a PORO in `app/models/revision/diff.rb`. It works on any two objects that respond to `versioned_attributes`, so the import preview can diff an **unsaved** parse against the latest revision, and the draft can diff against its base.

```ruby
class Revision < ApplicationRecord
  def diff_against(older) = Revision::Diff.new(from: older, to: self)
end

class Revision::Diff
  Section = Data.define(:key, :status, :heading_from, :heading_to, :ops, :from_position, :to_position)
  Field   = Data.define(:name, :from, :to, :ops, :length, :limit)   # length/limit for SERP checks
  Op      = Data.define(:type, :text)                               # type: "equal" | "insert" | "delete"

  SERP_LIMITS = { "meta_title" => 60, "meta_description" => 155 }.freeze

  def initialize(from:, to:)
    @from, @to = from, to
  end

  def sections = @sections ||= build_sections
  def fields = @fields ||= build_fields
  def summary = ... # built from counts, see below
end
```

## Section classification

Match by `key` (never by position or heading):

| Status | Rule |
|---|---|
| `added` | key only in `to` |
| `removed` | key only in `from` |
| `unchanged` | same key, same heading, same normalized text, same relative position |
| `moved` | same content, different relative order (use the LCS of the key sequences: keys outside it are moved) |
| `changed` | same key, heading or text differs (it can also be moved; `changed` wins, and keep `from_position`/`to_position` so the UI can show "moved" too) |

## Word-level ops

- Extract text from `body_html` with Nokogiri (`text` with block elements joined by `\n`), then tokenize into words + whitespace + punctuation: `text.scan(/\s+|[[:word:]]+|[^[:word:]\s]/)`
- `Diff::LCS.sdiff(from_tokens, to_tokens)` -> collapse consecutive same-type changes into `Op`s (`equal` / `insert` / `delete`; a `!` change becomes a delete followed by an insert)
- Count only word tokens for `words_added` / `words_removed`
- Headings are diffed the same way (small op list)
- Formatting-only changes (bold, link targets) are invisible to a text diff. Flag them as `changed` with an empty op delta and `formatting_changed: true` if the HTML differs but the text doesn't

## Fields and SERP checks

- `title`, `meta_title`, `meta_description` (and keywords, if they become versioned fields): word ops like sections
- `length` = `to.length`, `limit` from `SERP_LIMITS`. The UI shows "68 / 60" in red when over the limit

## Summary line

Ordered and pluralized: `"<n> sections changed, <n> added, <n> removed, <n> moved, <fields> changed, +<added> / −<removed> words"`. Omit zero parts. Use the real minus sign `−`. If there are no changes: `"No changes"`.

## Serialization (Alba)

```ruby
class RevisionDiffResource < ApplicationResource
  attributes :summary, :words_added, :words_removed

  many :sections, resource: RevisionDiffSectionResource   # key, status, heading_from, heading_to, ops, from_position, to_position
  many :fields,   resource: RevisionDiffFieldResource     # name, from, to, ops, length, limit
end
```

The hand-written TS types go in `app/frontend/types/diff.ts`:

```ts
export type DiffOpType = "equal" | "insert" | "delete"
export interface DiffOp { type: DiffOpType; text: string }
export type SectionStatus = "added" | "removed" | "changed" | "unchanged" | "moved"
export interface DiffSection {
  key: string
  status: SectionStatus
  heading_from: string | null
  heading_to: string | null
  ops: DiffOp[]
  from_position: number | null
  to_position: number | null
}
export interface DiffField { name: string; from: string | null; to: string | null; ops: DiffOp[]; length: number; limit: number | null }
export interface RevisionDiff { summary: string; words_added: number; words_removed: number; sections: DiffSection[]; fields: DiffField[] }
```

## Comparison page

- Route: `resource :comparison, only: :show` nested under pages -> `GET /pages/:page_id/comparison?from=3&to=5` -> `Pages::ComparisonsController#show`, `authorize page, :compare?` (`revisions.compare`)
- Shortcuts are just different `from` values computed in the model: `page.previous_revision(to)`, `page.latest_approved_revision`, `page.latest_publication&.revision` ("since last built"). Pass them as props so the UI can link to them
- Cache freely: revisions are immutable, so `Rails.cache.fetch(["diff", from.id, to.id]) { ... }` never goes stale
- Page: `app/frontend/pages/pages/comparisons/show.tsx`, with components in `app/frontend/components/diff/`:
  - `diff-summary.tsx`: the summary line + version pickers (`Select`) + shortcut buttons
  - `diff-section.tsx`: section card with a status `Badge` (added green, removed red, changed amber, moved blue, unchanged muted)
  - `diff-ops.tsx`: renders ops; `<ins className="bg-green-500/15 no-underline">`, `<del className="bg-red-500/15">`
  - The view toggle (inline / side-by-side) and "Hide unchanged" are URL query params (`?view=split&hide_unchanged=1`) and use `router.get(..., { preserveState: true })`, so links are shareable
- Inline comments: show open comments next to their `section_key`

## Tests (test/models/revision/diff_test.rb)

Build revisions from fixtures with small, explicit `sections` JSON:

```ruby
test "classifies sections by key" do
  diff = revisions(:acme_home_v2).diff_against(revisions(:acme_home_v1))
  statuses = diff.sections.to_h { [ _1.key, _1.status ] }

  assert_equal "changed",   statuses["hero"]
  assert_equal "unchanged", statuses["faq"]
  assert_equal "added",     statuses["cta"]
end

test "word level ops" do
  ops = revisions(:acme_home_v2).diff_against(revisions(:acme_home_v1)).sections.find { _1.key == "hero" }.ops
  assert_includes ops.map(&:to_h), { type: "insert", text: "lightweight" }
end

test "summary line" do
  assert_equal "1 section changed, 1 added, meta description changed, +3 / −1 words",
    revisions(:acme_home_v2).diff_against(revisions(:acme_home_v1)).summary
end

test "meta description over 155 chars is flagged" do
  # field.length > field.limit
end
```

Also test: renamed heading with the same key is `changed` (not removed + added), reordering is `moved`, identical revisions give "No changes".
