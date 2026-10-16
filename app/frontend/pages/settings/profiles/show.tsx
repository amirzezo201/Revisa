import { Form, Head, usePage } from "@inertiajs/react"

import DeleteUser from "@/components/delete-user"
import { SettingsSection } from "@/components/settings-section"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { settingsProfilePath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Profile settings",
    href: settingsProfilePath(),
  },
]

export default function Profile() {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <Form
          action={settingsProfilePath()}
          method="patch"
          options={{
            preserveScroll: true,
          }}
        >
          {({ errors, processing, recentlySuccessful }) => (
            <SettingsSection
              title="Profile information"
              description="Update your name"
              footer={
                <>
                  <Button type="submit" loading={processing}>
                    Save
                  </Button>

                  {recentlySuccessful && (
                    <p className="fade-in animate-in text-muted-foreground text-sm">
                      Saved
                    </p>
                  )}
                </>
              }
            >
              <Field invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>

                <Input
                  id="name"
                  name="name"
                  defaultValue={auth.user.name}
                  required
                  autoComplete="name"
                  placeholder="Full name"
                />

                <FieldError match={!!errors.name}>
                  {errors.name?.join(" ")}
                </FieldError>
              </Field>
            </SettingsSection>
          )}
        </Form>

        <DeleteUser />
      </SettingsLayout>
    </AppLayout>
  )
}
