import type { ReactNode } from "react"

import { ToastProvider } from "@/components/ui/toast"
import { useFlash } from "@/hooks/use-flash"

interface PersistentLayoutProps {
  children: ReactNode
}

function FlashToasts() {
  useFlash()
  return null
}

export default function PersistentLayout({ children }: PersistentLayoutProps) {
  return (
    <ToastProvider>
      <FlashToasts />
      <div className="relative isolate flex min-h-svh flex-col">{children}</div>
    </ToastProvider>
  )
}
