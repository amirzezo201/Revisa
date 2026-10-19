import { Form, Head } from "@inertiajs/react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/auth-layout"
import { identityInvitationPath } from "@/routes"

interface AcceptInvitationProps {
  token: string
  name: string
  email: string
}

export default function AcceptInvitation({
  token,
  name,
  email,
}: AcceptInvitationProps) {
  return (
    <AuthLayout
      title={`Welcome, ${name}`}
      description="Choose a password to finish setting up your account"
    >
      <Head title="Accept invitation" />
      <Form
        action={identityInvitationPath()}
        method="patch"
        transform={(data) => ({ ...data, token })}
        resetOnSuccess={["password", "password_confirmation"]}
      >
        {({ processing, errors }) => (
          <div className="flex flex-col gap-6">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} readOnly />
            </Field>

            <Field invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                autoFocus
                placeholder="At least 12 characters"
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
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                placeholder="Confirm password"
              />
              <FieldError match={!!errors.password_confirmation}>
                {errors.password_confirmation?.join(" ")}
              </FieldError>
            </Field>

            <Button type="submit" className="mt-4 w-full" loading={processing}>
              Set password and sign in
            </Button>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
