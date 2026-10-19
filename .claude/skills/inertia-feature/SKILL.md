---
name: inertia-feature
description: >-
  Revisa's recipe for a full vertical slice: route, Pundit policy, thin
  controller inheriting InertiaController with authorize/policy_scope, Alba
  resource, hand-written TS type in app/frontend/types, React page in
  app/frontend/pages/<controller path>/<action>.tsx (AppLayout, breadcrumbs,
  Inertia <Form>, @/components/ui), js-routes helpers, and a controller test.
  Use when adding a page, CRUD resource, form, or any new controller action
  in Revisa.
  WHEN NOT: Only adding a permission (use permissions), only model logic (use
  model-patterns / revisa-domain), generic Inertia API questions (use the
  inertia-rails-* skills).
license: MIT
compatibility: Ruby 4.0+, Rails 8.1, inertia_rails 3.x, React 19, TypeScript, Vite, Tailwind v4
---

# Inertia feature slice

Copy the real conventions from `app/controllers/admin/roles_controller.rb`, `app/controllers/settings/profiles_controller.rb`, `app/frontend/pages/admin/roles/index.tsx` and `app/frontend/pages/settings/profiles/show.tsx`.

Running example: **Sites** (`index`, `show`, `new`, `create`). Load `revisa-domain` first for anything content-related.

## 1. Test first

```ruby
# test/controllers/sites_controller_test.rb
require "test_helper"

class SitesControllerTest < ActionDispatch::IntegrationTest
  test "seo sees all sites" do
    sign_in users(:seo)
    get sites_path

    assert_response :success
    assert_inertia_component "sites/index"
  end

  test "client sees only their own sites" do
    sign_in users(:client)
    get sites_path

    # matchers for shapes; direct props access is fine for collection membership
    assert_equal [ sites(:acme).id ], inertia.props[:sites].map { _1[:id] }
  end

  test "create redirects with a notice" do
    sign_in users(:seo)
    assert_difference -> { Site.count } do
      post sites_path, params: { site: { name: "Globex", url: "https://globex.example" } }
    end
    follow_redirect!
    assert_inertia_flash notice: "Site created"
  end

  test "user without permission is bounced" do
    sign_in users(:client)
    post sites_path, params: { site: { name: "Nope", url: "https://x.example" } }

    assert_equal "You don't have permission to do that.", flash[:alert]
  end

  test "invalid site returns errors" do
    sign_in users(:seo)
    post sites_path, params: { site: { name: "" } }
    follow_redirect!
    assert_inertia_props errors: { name: [ "can't be blank" ] }
  end
end
```

The Inertia assertions come from `require "inertia_rails/minitest"`, already in `test/test_helper.rb`. After a redirect, call `follow_redirect!` before asserting flash or props.

## 2. Route

```ruby
# config/routes.rb
resources :sites, only: %i[ index show new create ] do
  scope module: :sites do
    resource :access, only: %i[ edit update ]   # state/sub-resource = its own controller
  end
end
```

Then run `bin/rails js:routes`. It regenerates `app/frontend/routes.js` + `routes.d.ts` (camelCase: `sitesPath()`, `sitePath(id)`, `newSitePath()`). CI fails if they're stale.

## 3. Policy (+ permission)

If the permission is new, follow the `permissions` skill. For standard CRUD, `ApplicationPolicy` already maps `index?/show?/create?` to `sites.*`. Add a `Scope`:

```ruby
# app/policies/site_policy.rb
class SitePolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if has_permission?(permission(:index))
        scope.all
      elsif has_permission?(permission(:index_own))
        scope.where(id: SiteAccess.where(user: user).select(:site_id))
      else
        scope.none
      end
    end
  end
end
```

## 4. Controller (thin)

```ruby
# app/controllers/sites_controller.rb
# frozen_string_literal: true

class SitesController < InertiaController
  before_action :set_site, only: :show

  def index
    authorize Site
    sites = policy_scope(Site).order(:name)

    render inertia: {
      sites: SiteResource.new(sites).to_h,
      can_create: policy(Site).create?
    }
  end

  def show
    render inertia: {
      site: SiteResource.new(@site).to_h,
      pages: PageResource.new(policy_scope(@site.pages).order(:title)).to_h
    }
  end

  def new
    authorize Site
  end

  def create
    @site = Site.new(site_params)
    authorize @site

    if @site.save
      redirect_to site_path(@site), notice: "Site created"
    else
      redirect_to new_site_path, inertia: { errors: @site.errors }
    end
  end

  private
    def set_site
      @site = authorize policy_scope(Site).find(params[:id])
    end

    def site_params
      params.expect(site: [ :name, :url ])
    end
end
```

Rules:
- Props are passed **explicitly** with `render inertia: { ... }`. Instance variables aren't serialized. A prop-less action (`new`) renders `sites/new` implicitly (`default_render: true`)
- Every action calls `authorize`, and `index` calls `policy_scope` (both enforced by `verify_authorized` / `verify_policy_scoped`)
- Per-record UI flags come from policies (`can_create: policy(Site).create?`), the same pattern as `Admin::UsersController`
- Errors: `redirect_to <form path>, inertia: { errors: record.errors }`. Success: redirect + `notice:` (shown as a toast by `useFlash`)
- Business logic goes in the model (`@page.save_draft_as_revision!(...)`), never in the controller
- State changes are new controllers (`Revisions::SubmissionsController#create`), never custom actions

## 5. Alba resource

```ruby
# app/resources/site_resource.rb
# frozen_string_literal: true

class SiteResource < ApplicationResource
  attributes :id, :name, :url, :created_at

  attribute :pages_count do |site|
    site.pages.size
  end
end
```

Explicit attributes only. Viewer-dependent output: `SiteResource.new(site, params: { user: Current.user })`. Admin-only shapes are namespaced (`Admin::RoleResource`).

## 6. TS type (hand-written, no Typelizer)

```ts
// app/frontend/types/index.ts (or a feature file re-exported from there)
export interface Site {
  id: number
  name: string
  url: string
  created_at: string
  pages_count: number
}
```

Keep it in sync with the resource attribute-for-attribute (snake_case keys, timestamps as `string`, IDs as `number`).

## 7. React pages

`app/frontend/pages/sites/index.tsx`:

```tsx
import { Head, Link } from "@inertiajs/react"
import { Plus } from "lucide-react"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { newSitePath, sitePath, sitesPath } from "@/routes"
import type { BreadcrumbItem, Site } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [{ title: "Sites", href: sitesPath() }]

interface SitesIndexProps {
  sites: Site[]
  can_create: boolean
}

export default function SitesIndex({ sites, can_create }: SitesIndexProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sites" />

      <div className="space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <Heading title="Sites" description="Client websites and their pages." />
          {can_create && (
            <Button render={<Link href={newSitePath()} />}>
              <Plus />
              New site
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Pages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <Link href={sitePath(site.id)} className="font-medium hover:underline">
                    {site.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right">{site.pages_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  )
}
```

`app/frontend/pages/sites/new.tsx` (form pattern from `settings/profiles/show.tsx`):

```tsx
import { Form, Head } from "@inertiajs/react"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import { newSitePath, sitesPath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Sites", href: sitesPath() },
  { title: "New site", href: newSitePath() },
]

export default function NewSite() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="New site" />

      <div className="max-w-xl space-y-6 px-4 py-6">
        <Heading title="New site" />

        <Form action={sitesPath()} method="post" className="space-y-4">
          {({ errors, processing }) => (
            <>
              <Field invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="site[name]" required />
                <FieldError match={!!errors.name}>{errors.name?.join(" ")}</FieldError>
              </Field>

              <Field invalid={!!errors.url}>
                <FieldLabel htmlFor="url">URL</FieldLabel>
                <Input id="url" name="site[url]" type="url" placeholder="https://" />
                <FieldError match={!!errors.url}>{errors.url?.join(" ")}</FieldError>
              </Field>

              <Button type="submit" loading={processing}>
                Create site
              </Button>
            </>
          )}
        </Form>
      </div>
    </AppLayout>
  )
}
```

Frontend rules:
- Page path = controller path + action: `Pages::RevisionsController#index` -> `pages/pages/revisions/index.tsx`
- Uncontrolled inputs with `name` (nested `site[name]` matches `params.expect(site: [...])`). Errors are keyed by attribute (`errors.name`) and are `string[]`
- `useForm` only for dynamic forms (the draft autosave, the section editor). Never react-hook-form or zod
- base-ui primitives use the `render` prop (`<Button render={<Link href=... />}>`), not `asChild`
- Hide actions with server flags (`can_create`) or `useCan()` (`@/hooks/use-can`). The server still authorizes
- No `useEffect` + fetch for page data. Use props, partial reloads (`router.reload({ only: ["pages"] })`) or `Deferred`
- Add a sidebar link in `app/frontend/components/app-sidebar.tsx` if the page is top-level, gated by `useCan()`

## 8. Finish

```bash
bin/rails test test/controllers/sites_controller_test.rb test/policies/site_policy_test.rb
bin/rubocop -a
pnpm lint:fix && pnpm check
```

## Checklist

- [ ] Failing controller test (+ policy test incl. cross-client)
- [ ] Route + `bin/rails js:routes`
- [ ] Policy / permission (see `permissions`)
- [ ] Controller: `authorize` everywhere, `policy_scope` on index and lookups, explicit props
- [ ] Alba resource + matching TS type
- [ ] Page(s) under `app/frontend/pages/<path>/<action>.tsx` with `AppLayout` + breadcrumbs + `Head`
- [ ] Tests, rubocop, `pnpm lint`, `pnpm check` green
