import { Head, router, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"
import { RoleSelect } from "@/components/admin/role-select"
import Heading from "@/components/heading"
import { PermissionPicker } from "@/components/permission-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import { adminUserPath, adminUsersPath, editAdminUserPath } from "@/routes"
import type {
  AdminUser,
  BreadcrumbItem,
  PermissionCatalogue,
  RoleOption,
} from "@/types"

interface EditUserProps {
  user: AdminUser & { direct_permission_ids: number[] }
  roles: RoleOption[]
  role_permission_ids: Record<string, number[]>
  can_assign_role: boolean
  can_manage_permissions: boolean
  permissions: PermissionCatalogue
}

export default function EditUser({
  user,
  roles,
  role_permission_ids,
  can_assign_role,
  can_manage_permissions,
  permissions,
}: EditUserProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "People", href: adminUsersPath() },
    { title: user.name, href: editAdminUserPath(user.id) },
  ]

  const form = useForm({
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    direct_permission_ids: user.direct_permission_ids,
  })

  const inheritedIds =
    form.data.role_id === null
      ? []
      : (role_permission_ids[form.data.role_id] ?? [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    // An empty array would be dropped from the params, so "" stands for "none".
    form.transform((data) => ({
      user: {
        ...data,
        direct_permission_ids:
          data.direct_permission_ids.length > 0
            ? data.direct_permission_ids.filter(
                (id) => !inheritedIds.includes(id),
              )
            : [""],
      },
    }))
    form.patch(adminUserPath(user.id))
  }

  const destroy = () => {
    if (confirm(`Remove ${user.name}? They will lose access immediately.`)) {
      router.delete(adminUserPath(user.id))
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={user.name} />

      <form onSubmit={submit} className="max-w-4xl space-y-8 px-4 py-6">
        <div className="flex items-center gap-3">
          <Heading title={user.name} description={user.email} />
          {user.is_owner && <Badge className="mb-8">Owner</Badge>}
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
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

          <Field invalid={!!form.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={form.data.email}
              onChange={(event) => form.setData("email", event.target.value)}
              required
            />
            <FieldError match={!!form.errors.email}>
              {form.errors.email?.join(" ")}
            </FieldError>
          </Field>

          {!user.is_owner && (
            <Field>
              <FieldLabel htmlFor="role_id">Role</FieldLabel>
              <RoleSelect
                roles={roles}
                value={form.data.role_id}
                onChange={(roleId) => form.setData("role_id", roleId)}
                disabled={!can_assign_role}
              />
            </Field>
          )}
        </div>

        {user.is_owner && (
          <p className="text-muted-foreground text-sm">
            The owner can do everything, so they have no role or extra
            permissions.
          </p>
        )}

        {can_manage_permissions && (
          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Extra permissions</h3>
              <p className="text-muted-foreground text-sm">
                Granted to {user.name} on top of their role. Permissions from
                the role are shown locked.
              </p>
            </div>
            <PermissionPicker
              catalogue={permissions}
              selectedIds={form.data.direct_permission_ids}
              inheritedIds={inheritedIds}
              onChange={(ids) => form.setData("direct_permission_ids", ids)}
            />
          </section>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={form.processing}>
            Save
          </Button>
          {!user.is_owner && (
            <Button
              type="button"
              variant="destructive-outline"
              className="ml-auto"
              onClick={destroy}
            >
              Remove
            </Button>
          )}
        </div>
      </form>
    </AppLayout>
  )
}
