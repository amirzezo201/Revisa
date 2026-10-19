---
paths:
  - "app/jobs/**/*.rb"
  - "test/jobs/**/*.rb"
---

# Job Conventions

- Shallow jobs: call model methods, never contain business logic
- Three-part `_later`/`_now` chain:
  1. The model defines `notify_reviewers_later` (enqueues) and `notify_reviewers_now` (does the work)
  2. `Submission::NotifyReviewersJob#perform(submission)` calls `submission.notify_reviewers_now`
  3. Callbacks (`after_create_commit`) or controllers call `submission.notify_reviewers_later`
- Solid Queue (database-backed, no Redis, no Sidekiq)
- Jobs must be idempotent: safe to run more than once
- Recurring jobs go in `config/recurring.yml`
- Pass records, not IDs (GlobalID). If a job needs the acting user, pass it explicitly. `Current` is not restored in jobs
- Heavy work that must not block requests (pandoc conversion of large docs, bulk imports, emails) goes through `_later`
