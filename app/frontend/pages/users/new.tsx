import { Form, Head } from "@inertiajs/react"

import TextLink from "@/components/text-link"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/auth-layout"
import { signInPath, signUpPath } from "@/routes"

export default function Register() {
  return (
    <AuthLayout
      footer={
        <>
          Already have an account?{" "}
          <TextLink href={signInPath()} tabIndex={6}>
            Log in
          </TextLink>
        </>
      }
      title="Create an account"
      description="Enter your details below to create your account"
    >
      <Head title="Register" />
      <Form
        action={signUpPath()}
        method="post"
        resetOnSuccess={["password", "password_confirmation"]}
        disableWhileProcessing
        className="flex flex-col gap-6"
      >
        {({ processing, errors }) => (
          <>
            <div className="flex flex-col gap-6">
              <Field invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="name"
                  disabled={processing}
                  placeholder="Full name"
                />
                <FieldError match={!!errors.name}>
                  {errors.name?.join(" ")}
                </FieldError>
              </Field>

              <Field invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  tabIndex={2}
                  autoComplete="email"
                  placeholder="email@example.com"
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
                  required
                  tabIndex={3}
                  autoComplete="new-password"
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
                  required
                  tabIndex={4}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                />
                <FieldError match={!!errors.password_confirmation}>
                  {errors.password_confirmation?.join(" ")}
                </FieldError>
              </Field>

              <Button
                type="submit"
                className="mt-2 w-full"
                tabIndex={5}
                loading={processing}
              >
                Create account
              </Button>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
