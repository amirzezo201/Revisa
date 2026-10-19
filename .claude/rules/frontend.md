---
paths:
  - "app/frontend/**/*.ts"
  - "app/frontend/**/*.tsx"
  - "app/resources/**/*.rb"
---

# Frontend Conventions (Inertia + React + TypeScript)

Recipe for a full slice: the `inertia-feature` skill. The general Inertia skills (`inertia-rails-*`, `shadcn-inertia`) apply too.

## Pages
- One page per controller action: `app/frontend/pages/<controller path>/<action>.tsx` (`Pages::RevisionsController#index` -> `pages/pages/revisions/index.tsx`)
- Default export, typed props: `export default function RevisionsIndex({ page, revisions }: Props)`
- Wrap in `<AppLayout breadcrumbs={breadcrumbs}>` + `<Head title=... />`. Breadcrumb hrefs come from `@/routes`
- Shared props come from `usePage().props` (`auth.user` is a `CurrentUser` with `is_owner` + `permissions`). They're typed via `InertiaConfig` in `types/globals.d.ts`
- Data arrives as props from the controller. **Never** `useEffect` + `fetch` to load page data. Use `router.reload({ only: [...] })` or partial reloads
- Flash messages appear as toasts through `useFlash()`. Don't render flash by hand

## Forms
- `<Form action={pagesPath()} method="post">` from `@inertiajs/react` with a render prop `({ errors, processing, recentlySuccessful })`
- Inputs are uncontrolled with a `name` attribute: `<Input name="title" defaultValue={page.title} />`
- Errors: `<Field invalid={!!errors.title}>` ... `<FieldError match={!!errors.title}>{errors.title?.join(" ")}</FieldError>` (errors are `string[]`)
- `useForm` only for dynamic/programmatic cases (autosaving the draft, the section editor). Never react-hook-form or zod
- File uploads (.docx): `<Form>` with `<input type="file" name="document">`. Inertia sends multipart automatically

## Components
- Use primitives from `@/components/ui/*` (base-ui based: `Button`, `Field`, `Input`, `Dialog`, `Menu`, `Table`, `Badge`, `Tabs`, `Toast`).
  They use base-ui's `render` prop, not Radix `asChild`: `<Button render={<Link href={...} />}>`
- App-level components go in `app/frontend/components/`, kebab-case file names. Feature-specific ones go in `components/<feature>/`
- Tailwind v4 utility classes, `cn()` from `@/lib/utils`. Biome sorts classes, so run `pnpm lint:fix`

## Routes, types, permissions
- URLs only come from `@/routes` helpers (`pageRevisionsPath(page.id)`). Never hard-code paths. Run `bin/rails js:routes` after route changes
- TS types for resources are hand-written in `app/frontend/types/` (no Typelizer) and must match the Alba resource attribute-for-attribute
- `const can = useCan()` (`@/hooks/use-can`), then `can("revisions.import")`, hides actions the user can't take. Outside components: `can(user, name)` / `canAny(user, ...names)` from `@/lib/permissions`. The server still enforces them
- Diffs are computed on the server (`Revision::Diff` -> Alba). React only renders the ops

## Alba resources (`app/resources`)
- `class RevisionResource < ApplicationResource; attributes :id, :number, ...; end`. Admin-only shapes are namespaced (`Admin::RoleResource`)
- Explicit attributes only. Never serialize whole models. Never expose internal comments to users without `comments.view_internal` (filter in the controller/scope, not in React)
- Pass context with `params:` (`CommentResource.new(comments, params: { user: Current.user }).to_h`) when output depends on the viewer

## Checks
- `pnpm lint` (Biome) and `pnpm check` (tsc) must pass
