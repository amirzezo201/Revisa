---
name: word-import
description: >-
  Importing Word (.docx) files into Revisa revisions: the pandoc pipeline,
  splitting on Heading 1/2 into sections, matching section keys against the
  previous revision, extracting metadata lines (Meta Title, Meta Description,
  Keyword, URL), the upload preview flow, bulk import, and .docx fixture tests.
  Use when touching Revision::Import, Pages::ImportsController, the upload
  dropzone, or when the user asks to recognise a new line or heading style.
  WHEN NOT: Editor-based versions (use content-versioning), diff rendering
  (use content-diff), exporting .docx (review-workflow / hand-off).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, pandoc 3.x (installed in Dockerfile), Active Storage
---

# Word import

Not built yet. This is the intended design from `docs/plans/content-versioning.md`, under "Word import". The real SEO doc conventions are still **open** (the plan asks for sample docs), so keep the rules in one place so they're easy to change once samples arrive.

## Pipeline

```
.docx ──pandoc──▶ HTML ──split on h1/h2──▶ sections ──match keys vs previous revision──▶ Revision (source: "upload")
                    └─ metadata lines pulled out (Meta Title:, Meta Description:, Keyword:, URL:)
```

`Revision::Import` is a PORO in `app/models/revision/import.rb`. It's a model, not a service:

```ruby
class Revision::Import
  METADATA_LINES = {
    /\Ameta\s*title\s*:\s*/i       => :meta_title,
    /\Ameta\s*description\s*:\s*/i => :meta_description,
    /\A(target\s*)?keyword\s*:\s*/i => :target_keyword, # Page field, see note below
    /\Aurl\s*:\s*/i                => :slug            # Page field, see note below
  }.freeze

  attr_reader :page, :file, :warnings

  def initialize(page:, file:)
    @page, @file, @warnings = page, file, []
  end

  # Parse without saving. Used for the preview and by #save
  def attributes
    @attributes ||= begin
      html = convert_to_html
      metadata, body = extract_metadata(html)
      { title: metadata[:title] || page.title, sections: match_keys(split_sections(body)), **metadata.slice(:meta_title, :meta_description) }
    end
  end

  def save!(change_summary: nil, author: Current.user)
    page.with_lock do
      revision = page.revisions.create!(**attributes, source: "upload", author:,
        change_summary: change_summary.presence || "Uploaded #{file.original_filename}")
      revision.source_document.attach(file)
      revision
    end
  end

  private
    def convert_to_html
      stdout, stderr, status = Open3.capture3(
        "pandoc", "--from=docx", "--to=html5", "--track-changes=accept", "--wrap=none",
        stdin_data: file.read, binmode: true
      )
      raise Revision::Import::Error, stderr unless status.success?
      stdout
    end

    # extract_metadata(html): Nokogiri; paragraphs matching METADATA_LINES -> fields, removed from the body
    # split_sections(html):   every <h1>/<h2> starts a section; content before the first heading -> "intro"
    # match_keys(sections):   see "Section key matching" below
end
```

Notes:
- `target_keyword` / `slug` live on `Page`, not on `Revision`, in the current data model. The import fills them on the page only when they're blank, and shows a warning when they differ. The plan also says the diff reports "keywords". If keywords must be versioned, add them as versioned fields first (`content-versioning` checklist). This is an open question, so confirm with the user
- Use `Open3.capture3` with an argv array (no shell string), and pass the file through **stdin**. Never interpolate filenames
- `--track-changes=accept` lets docs that still have tracked changes import cleanly
- **Images are dropped** (`<img>` removed). Add a warning: "3 images were skipped. Add images in Elementor."
- Sanitize `body_html` with an allowlist (`p h3 h4 ul ol li strong em a table thead tbody tr th td blockquote`) via `Rails::HTML5::SafeListSanitizer`
- `kind` inference: a heading text like "FAQ" or "Frequently asked questions" -> `faq`; a short section with a single link -> `cta`; only lists -> `list`; otherwise `rich_text`. The first h1 can be `heading`
- Large files or bulk imports go through `_later` (`Revision::ImportJob`), while a single upload with a preview runs inline

## Section key matching

Keys must stay stable so diffs and comments line up across versions.

1. Exact heading match (case- and whitespace-insensitive) against `page.latest_revision.sections` -> reuse that key
2. Otherwise fuzzy match by **position + similarity** (heading similarity above about 0.6, or same index with similar body) -> reuse the key. This handles "renamed heading in v4"
3. Otherwise a new key: `heading.parameterize.first(40)`, deduped with `-2`, `-3`
4. A key is used at most once per revision

On the first import (no previous revision), all keys come from step 3. Well-known headings may map to canonical keys (`hero`, `intro`, `faq`, `cta`).

## Adding a recognised metadata line

1. Add the regex to `METADATA_LINES` (anchored, case-insensitive, colon tolerant)
2. If it maps to a new field, follow the `content-versioning` checklist (Draft + Revision + digest + diff)
3. Add a line to the fixture doc (or a new fixture) and a test asserting the field is set **and** the line isn't in any section body

## Upload flow (controllers and pages)

No custom `preview` action. Preview and save are both `Pages::ImportsController#create`:

| Step | Request | Result |
|---|---|---|
| Open dropzone | `GET /pages/:page_id/imports/new` | renders `pages/imports/new` |
| Preview | `POST /pages/:page_id/imports` with `document` (no `confirm`) | uploads the blob, parses, re-renders `pages/imports/new` with the preview + `signed_id` |
| Save | `POST /pages/:page_id/imports` with `signed_id`, `change_summary`, `confirm=1` | `Revision::Import#save!`, redirects to the new revision |
| Bulk | `POST /sites/:site_id/imports` with several files | `Sites::ImportsController#create`, one page per file, each at v1 (`_later`) |

Preview props: `{ page, preview: { sections, meta_title, meta_description }, diff: RevisionDiffResource (vs latest), warnings, signed_id }`. Both steps call `authorize page, :import?` (`revisions.import`). Unconfirmed blobs are purged by a recurring cleanup job.

The page `app/frontend/pages/pages/imports/new.tsx` contains a dropzone (`<input type="file" accept=".docx">` in an Inertia `<Form>`), the parsed sections, the diff against the latest version (reuse the `content-diff` components), the warnings, a change summary field and a "Save as vN" button.

## Tests

- Real `.docx` fixtures in `test/fixtures/files/` (`seo_doc_v1.docx`, `seo_doc_v2_renamed_heading.docx`, `with_tracked_changes.docx`, `with_images.docx`). Make them in Word or LibreOffice. Don't generate them at test time
- `test/models/revision/import_test.rb`:

```ruby
test "splits on headings and extracts metadata" do
  import = Revision::Import.new(page: pages(:acme_home), file: fixture_file_upload("seo_doc_v1.docx"))

  assert_equal "Best running shoes | Acme", import.attributes[:meta_title]
  assert_equal %w[ hero intro faq cta ], import.attributes[:sections].pluck("key")
  refute import.attributes[:sections].any? { _1["body_html"].include?("Meta Title:") }
end

test "renamed heading keeps its key" do
  # page whose latest revision has a section with key "intro" and heading "Why choose us"
  import = Revision::Import.new(page: pages(:acme_home), file: fixture_file_upload("seo_doc_v2_renamed_heading.docx"))
  assert_includes import.attributes[:sections].pluck("key"), "intro"
end

test "identical upload is rejected" do
  # importing the same doc twice -> RecordInvalid "Identical to vN"
end
```

- Skip pandoc-dependent tests when the binary is missing locally: `skip "pandoc not installed" unless system("which pandoc", out: File::NULL)`. CI and Docker must have it.
