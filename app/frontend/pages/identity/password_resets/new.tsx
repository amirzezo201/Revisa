import { Form, Head } from "@inertiajs/react"

import TextLink from "@/components/text-link"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/auth-layout"
import { identityPasswordResetPath, signInPath } from "@/routes"

export default function ForgotPassword() {
  return (
    <AuthLayout
      footer={
        <>
          Or, return to <TextLink href={signInPath()}>log in</TextLink>
        </>
      }
      title="Forgot password"
      description="Enter your email to receive a password reset link"
    >
      <Head title="Forgot password" />

      <div className="space-y-6">
        <Form action={identityPasswordResetPath()} method="post">
          {({ processing, errors }) => (
            <>
              <Field invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="off"
                  autoFocus
                  placeholder="email@example.com"
                />
                <FieldError match={!!errors.email}>
                  {errors.email?.join(" ")}
                </FieldError>
              </Field>

              <div className="mt-6 flex items-center justify-start">
                <Button type="submit" className="w-full" loading={processing}>
                  Email password reset link
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </AuthLayout>
  )
}
