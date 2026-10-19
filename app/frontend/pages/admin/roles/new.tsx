import { Head, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import { adminRolesPath, newAdminRolePath } from "@/routes"
import type { BreadcrumbItem, RoleOption } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Roles", href: adminRolesPath() },
  { title: "New role", href: newAdminRolePath() },
]

interface RoleTemplate {
  key: string
  name: string
  description: string
  permissions_count: number
}

interface NewRoleProps {
  templates: RoleTemplate[]
  roles: RoleOption[]
}

// "template:seo", "role:3" or "blank"
type StartingPoint = string

export default function NewRole({ templates, roles }: NewRoleProps) {
  const form = useForm({
    name: "",
    description: "",
    start: "blank" as StartingPoint,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.transform(({ name, description, start }) => {
      const [kind, value] = start.split(":")
      return {
        role: {
          name,
          description,
          template: kind === "template" ? value : undefined,
          copy_from_role_id: kind === "role" ? value : undefined,
        },
      }
    })
    form.post(adminRolesPath())
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="New role" />

      <form onSubmit={submit} className="max-w-2xl space-y-8 px-4 py-6">
        <Heading
          title="New role"
          description="Start from a template or an existing role, then fine-tune its permissions on the next screen."
        />

        <Field invalid={!!form.errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={form.data.name}
            onChange={(event) => form.setData("name", event.target.value)}
            placeholder="e.g. Senior writer"
            required
            autoFocus
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
            placeholder="Left blank, the template's description is used"
          />
        </Field>

        <fieldset className="space-y-3">
          <legend className="mb-3 font-medium text-sm">Start from</legend>
          <RadioGroup
            value={form.data.start}
            onValueChange={(value) => form.setData("start", value as string)}
            className="gap-3"
          >
            {templates.map((template) => (
              <StartOption
                key={template.key}
                value={`template:${template.key}`}
                title={`${template.name} template`}
                detail={`${template.description} ${template.permissions_count} permissions.`}
              />
            ))}
            {roles.map((role) => (
              <StartOption
                key={role.id}
                value={`role:${role.id}`}
                title={`Copy of ${role.name}`}
              />
            ))}
            <StartOption
              value="blank"
              title="Blank"
              detail="No permissions. Pick them one by one."
            />
          </RadioGroup>
        </fieldset>

        <Button type="submit" loading={form.processing}>
          Create role
        </Button>
      </form>
    </AppLayout>
  )
}

function StartOption({
  value,
  title,
  detail,
}: {
  value: string
  title: string
  detail?: string
}) {
  const id = `start_${value.replace(":", "_")}`

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <Radio id={id} value={value} />
      <Label htmlFor={id} className="block font-normal">
        <span className="font-medium">{title}</span>
        {detail && (
          <span className="block text-muted-foreground text-sm">{detail}</span>
        )}
      </Label>
    </div>
  )
}
