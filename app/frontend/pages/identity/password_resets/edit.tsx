import { Form, Head } from "@inertiajs/react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/auth-layout"
import { identityPasswordResetPath } from "@/routes"

interface ResetPasswordProps {
  sid: string
  email: string
}

export default function ResetPassword({ sid, email }: ResetPasswordProps) {
  return (
    <AuthLayout
      title="Reset password"
      description="Please enter your new password below"
    >
      <Head title="Reset password" />
      <Form
        action={identityPasswordResetPath()}
        method="patch"
        transform={(data) => ({ ...data, sid, email })}
        resetOnSuccess={["password", "password_confirmation"]}
      >
        {({ processing, errors }) => (
          <div className="flex flex-col gap-6">
            <Field invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                readOnly
              />
              <FieldError match={!!errors.email}>
                {errors.email?.join(" ")}
              </FieldError>
            </Field>

            <Field invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                autoFocus
                placeholder="Password"
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
              Reset password
            </Button>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
