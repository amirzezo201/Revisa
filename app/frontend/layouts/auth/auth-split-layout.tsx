import { Link } from "@inertiajs/react"
import type { PropsWithChildren, ReactNode } from "react"

import AppLogoIcon from "@/components/app-logo-icon"
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card"
import authImage from "@/images/auth/auth-hero.webp"
import { rootPath } from "@/routes"

interface AuthLayoutProps {
  title?: string
  description?: string
  footer?: ReactNode
}

export default function AuthSplitLayout({
  children,
  title,
  description,
  footer,
}: PropsWithChildren<AuthLayoutProps>) {
  const appName = import.meta.env.VITE_APP_NAME ?? "Revisa"

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-black text-white lg:block">
        <img
          src={authImage}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/85 via-black/50 to-transparent" />

        <div className="relative flex h-full flex-col p-10">
          <Link
            href={rootPath()}
            className="flex items-center gap-2 font-heading font-medium text-lg"
          >
            <AppLogoIcon className="size-8 fill-current" />
            {appName}
          </Link>
          <blockquote className="mt-auto space-y-2">
            <p className="text-balance text-lg">
              &ldquo;The One Person Framework. A toolkit so powerful that it
              allows a single individual to create modern applications upon
              which they might build a competitive business.&rdquo;
            </p>
            <footer className="text-sm text-white/70">DHH</footer>
          </blockquote>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <Link href={rootPath()} className="lg:hidden">
          <AppLogoIcon className="size-10 fill-current text-foreground" />
          <span className="sr-only">{appName}</span>
        </Link>

        <CardFrame className="w-full max-w-md">
          <CardFrameHeader>
            <CardFrameTitle className="font-heading text-base">
              {title}
            </CardFrameTitle>
            <CardFrameDescription>{description}</CardFrameDescription>
          </CardFrameHeader>
          <Card>
            <CardPanel>{children}</CardPanel>
          </Card>
          {footer && (
            <CardFrameFooter className="text-center text-muted-foreground text-sm">
              {footer}
            </CardFrameFooter>
          )}
        </CardFrame>
      </div>
    </div>
  )
}
