import { Form, Head } from "@inertiajs/react"

import TextLink from "@/components/text-link"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/layouts/auth-layout"
import { newIdentityPasswordResetPath, signInPath, signUpPath } from "@/routes"

export default function Login() {
  return (
    <AuthLayout
      footer={
        <>
          Don&apos;t have an account?{" "}
          <TextLink href={signUpPath()} tabIndex={5}>
            Sign up
          </TextLink>
        </>
      }
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      <Head title="Log in" />
      <Form
        action={signInPath()}
        method="post"
        resetOnSuccess={["password"]}
        className="flex flex-col gap-6"
      >
        {({ processing, errors }) => (
          <>
            <div className="flex flex-col gap-6">
              <Field invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="email"
                  placeholder="email@example.com"
                />
                <FieldError match={!!errors.email}>
                  {errors.email?.join(" ")}
                </FieldError>
              </Field>

              <Field invalid={!!errors.password}>
                <div className="flex w-full items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <TextLink
                    href={newIdentityPasswordResetPath()}
                    className="ml-auto text-sm"
                    tabIndex={5}
                  >
                    Forgot password?
                  </TextLink>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  tabIndex={2}
                  autoComplete="current-password"
                  placeholder="Password"
                />
                <FieldError match={!!errors.password}>
                  {errors.password?.join(" ")}
                </FieldError>
              </Field>

              <Button
                type="submit"
                className="mt-4 w-full"
                tabIndex={4}
                loading={processing}
              >
                Log in
              </Button>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
