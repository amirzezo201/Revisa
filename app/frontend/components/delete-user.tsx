import { Form } from "@inertiajs/react"
import { useRef } from "react"

import { SettingsSection } from "@/components/settings-section"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { usersPath } from "@/routes"

export default function DeleteUser() {
  const passwordInput = useRef<HTMLInputElement>(null)

  return (
    <SettingsSection
      title="Delete account"
      description="Delete your account and all of its resources"
      footer={
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" />}>
            Delete account
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to delete your account?
              </DialogTitle>
              <DialogDescription>
                Once your account is deleted, all of its resources and data will
                also be permanently deleted. Please enter your password to
                confirm you would like to permanently delete your account.
              </DialogDescription>
            </DialogHeader>
            <Form
              action={usersPath()}
              method="delete"
              options={{
                preserveScroll: true,
              }}
              onError={() => passwordInput.current?.focus()}
              resetOnSuccess
              className="contents"
            >
              {({ resetAndClearErrors, processing, errors }) => (
                <>
                  <DialogPanel>
                    <Field invalid={!!errors.password_challenge}>
                      <FieldLabel
                        htmlFor="password_challenge"
                        className="sr-only"
                      >
                        Password
                      </FieldLabel>
                      <Input
                        id="password_challenge"
                        type="password"
                        name="password_challenge"
                        ref={passwordInput}
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                      <FieldError match={!!errors.password_challenge}>
                        {errors.password_challenge?.join(" ")}
                      </FieldError>
                    </Field>
                  </DialogPanel>

                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button
                          variant="ghost"
                          onClick={() => resetAndClearErrors()}
                        />
                      }
                    >
                      Cancel
                    </DialogClose>
                    <Button
                      type="submit"
                      variant="destructive"
                      loading={processing}
                    >
                      Delete account
                    </Button>
                  </DialogFooter>
                </>
              )}
            </Form>
          </DialogPopup>
        </Dialog>
      }
    >
      <p className="text-destructive-foreground text-sm">
        Please proceed with caution, this cannot be undone.
      </p>
    </SettingsSection>
  )
}
