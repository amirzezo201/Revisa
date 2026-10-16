import { Form, Head, Link, usePage } from "@inertiajs/react"

import { SettingsSection } from "@/components/settings-section"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { identityEmailVerificationPath, settingsEmailPath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Email settings",
    href: settingsEmailPath(),
  },
]

export default function Email() {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <Form
          action={settingsEmailPath()}
          method="patch"
          options={{
            preserveScroll: true,
          }}
          resetOnError={["password_challenge"]}
          resetOnSuccess={["password_challenge"]}
        >
          {({ errors, processing, recentlySuccessful }) => (
            <SettingsSection
              title="Update email"
              description="Update your email address and verify it"
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
              <div className="flex flex-col gap-6">
                <Field invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>

                  <Input
                    id="email"
                    type="email"
                    name="email"
                    defaultValue={auth.user.email}
                    required
                    autoComplete="username"
                    placeholder="Email address"
                  />

                  <FieldError match={!!errors.email}>
                    {errors.email?.join(" ")}
                  </FieldError>
                </Field>

                {!auth.user.verified && (
                  <div>
                    <p className="-mt-4 text-muted-foreground text-sm">
                      Your email address is unverified.{" "}
                      <Link
                        href={identityEmailVerificationPath()}
                        method="post"
                        as="button"
                        className="text-foreground underline decoration-border underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                      >
                        Click here to resend the verification email.
                      </Link>
                    </p>
                  </div>
                )}

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
              </div>
            </SettingsSection>
          )}
        </Form>
      </SettingsLayout>
    </AppLayout>
  )
}
