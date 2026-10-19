import { Head, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"
import { RoleSelect } from "@/components/admin/role-select"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import { adminUsersPath, newAdminUserPath } from "@/routes"
import type { BreadcrumbItem, RoleOption } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "People", href: adminUsersPath() },
  { title: "Invite", href: newAdminUserPath() },
]

interface NewUserProps {
  roles: RoleOption[]
}

export default function NewUser({ roles }: NewUserProps) {
  const form = useForm({
    name: "",
    email: "",
    role_id: null as number | null,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.transform((data) => ({ user: data }))
    form.post(adminUsersPath())
  }

  const selectedRole = roles.find((role) => role.id === form.data.role_id)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Invite" />

      <form onSubmit={submit} className="max-w-xl space-y-6 px-4 py-6">
        <Heading
          title="Invite someone"
          description="They'll get an email with a link to choose a password. The link lasts 7 days."
        />

        <Field invalid={!!form.errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={form.data.name}
            onChange={(event) => form.setData("name", event.target.value)}
            required
            autoFocus
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

        <Field>
          <FieldLabel htmlFor="role_id">Role</FieldLabel>
          <RoleSelect
            roles={roles}
            value={form.data.role_id}
            onChange={(roleId) => form.setData("role_id", roleId)}
          />
          {selectedRole?.description && (
            <p className="text-muted-foreground text-sm">
              {selectedRole.description}
            </p>
          )}
        </Field>

        <Button type="submit" loading={form.processing}>
          Send invitation
        </Button>
      </form>
    </AppLayout>
  )
}
