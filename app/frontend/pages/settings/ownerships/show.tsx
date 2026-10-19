import { Head, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"

import { SettingsSection } from "@/components/settings-section"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { settingsOwnershipPath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Ownership", href: settingsOwnershipPath() },
]

interface Candidate {
  id: number
  name: string
  email: string
}

interface OwnershipProps {
  candidates: Candidate[]
}

export default function Ownership({ candidates }: OwnershipProps) {
  const form = useForm({ user_id: "" })
  const items = candidates.map((candidate) => ({
    value: String(candidate.id),
    label: `${candidate.name} (${candidate.email})`,
  }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const candidate = candidates.find(
      (each) => String(each.id) === form.data.user_id,
    )
    if (
      candidate &&
      confirm(
        `Make ${candidate.name} the owner? You will become an Admin and can't undo this yourself.`,
      )
    ) {
      form.patch(settingsOwnershipPath())
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Ownership" />

      <SettingsLayout>
        <form onSubmit={submit}>
          <SettingsSection
            title="Transfer ownership"
            description="The owner can do everything, including managing roles and permissions. There is exactly one owner."
            footer={
              <Button
                type="submit"
                variant="destructive"
                disabled={!form.data.user_id}
                loading={form.processing}
              >
                Transfer ownership
              </Button>
            }
          >
            <Field>
              <FieldLabel htmlFor="user_id">New owner</FieldLabel>
              <Select
                items={items}
                value={form.data.user_id}
                onValueChange={(value) =>
                  form.setData("user_id", (value as string) ?? "")
                }
              >
                <SelectTrigger id="user_id">
                  <SelectValue placeholder="Choose a person" />
                </SelectTrigger>
                <SelectPopup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </SettingsSection>
        </form>
      </SettingsLayout>
    </AppLayout>
  )
}
