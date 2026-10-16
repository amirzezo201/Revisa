import { Form, Head } from "@inertiajs/react"

import { SettingsSection } from "@/components/settings-section"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { settingsPasswordPath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Password settings",
    href: settingsPasswordPath(),
  },
]

export default function Password() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <Form
          action={settingsPasswordPath()}
          method="patch"
          options={{
            preserveScroll: true,
          }}
          resetOnError
          resetOnSuccess
        >
          {({ errors, processing, recentlySuccessful }) => (
            <SettingsSection
              title="Update password"
              description="Ensure your account is using a long, random password to stay secure"
              footer={
                <>
                  <Button type="submit" loading={processing}>
                    Save password
                  </Button>

                  {recentlySuccessful && (
                    <p className="fade-in animate-in text-muted-foreground text-sm">
                      Saved
                    </p>
                  )}
                </>
              }
            >
              <div className="flex flex-col gap-6">
                <Field invalid={!!errors.password_challenge}>
                  <FieldLabel htmlFor="password_challenge">
                    Current password
                  </FieldLabel>

                  <Input
                    id="password_challenge"
                    name="password_challenge"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Current password"
                  />

                  <FieldError match={!!errors.password_challenge}>
                    {errors.password_challenge?.join(" ")}
                  </FieldError>
                </Field>

                <Field invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">New password</FieldLabel>

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="New password"
                  />

                  <FieldError match={!!errors.password}>
                    {errors.password?.join(" ")}
                  </FieldError>
                </Field>

                <Field invalid={!!errors.password_confirmation}>
                  <FieldLabel htmlFor="password_confirmation">
                    Confirm password
                  </FieldLabel>

                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                  />

                  <FieldError match={!!errors.password_confirmation}>
                    {errors.password_confirmation?.join(" ")}
                  </FieldError>
                </Field>
              </div>
            </SettingsSection>
          )}
        </Form>
      </SettingsLayout>
    </AppLayout>
  )
}
