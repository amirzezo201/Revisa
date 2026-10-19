import { Head, router, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"

import Heading from "@/components/heading"
import { PermissionPicker } from "@/components/permission-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import { adminRolePath, adminRolesPath, editAdminRolePath } from "@/routes"
import type { AdminRole, BreadcrumbItem, PermissionCatalogue } from "@/types"

interface EditRoleProps {
  role: AdminRole & { permission_ids: number[] }
  permissions: PermissionCatalogue
}

export default function EditRole({ role, permissions }: EditRoleProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Roles", href: adminRolesPath() },
    { title: role.name, href: editAdminRolePath(role.id) },
  ]

  const form = useForm({
    name: role.name,
    description: role.description ?? "",
    permission_ids: role.permission_ids,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    // An empty array would be dropped from the params, so "" stands for "none".
    form.transform((data) => ({
      role: {
        ...data,
        permission_ids:
          data.permission_ids.length > 0 ? data.permission_ids : [""],
      },
    }))
    form.patch(adminRolePath(role.id))
  }

  const destroy = () => {
    if (confirm(`Delete the ${role.name} role?`)) {
      router.delete(adminRolePath(role.id))
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit ${role.name}`} />

      <form onSubmit={submit} className="max-w-4xl space-y-8 px-4 py-6">
        <Heading
          title={role.name}
          description={`${role.users_count} ${role.users_count === 1 ? "person has" : "people have"} this role. Changes apply to them straight away.`}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Field invalid={!!form.errors.name}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              value={form.data.name}
              onChange={(event) => form.setData("name", event.target.value)}
              required
            />
            <FieldError match={!!form.errors.name}>
              {form.errors.name?.join(" ")}
            </FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.data.description}
              onChange={(event) =>
                form.setData("description", event.target.value)
              }
            />
          </Field>
        </div>

        <PermissionPicker
          catalogue={permissions}
          selectedIds={form.data.permission_ids}
          onChange={(ids) => form.setData("permission_ids", ids)}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" loading={form.processing}>
            Save role
          </Button>
          <Button
            type="button"
            variant="destructive-outline"
            className="ml-auto"
            onClick={destroy}
            disabled={role.users_count > 0}
            title={
              role.users_count > 0
                ? "Move everyone to another role first"
                : undefined
            }
          >
            Delete role
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
