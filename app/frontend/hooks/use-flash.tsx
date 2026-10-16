import { usePage } from "@inertiajs/react"
import { useEffect } from "react"

import { toastManager } from "@/components/ui/toast"
import type { FlashData } from "@/types"

function showFlash(flash: FlashData) {
  if (flash.alert) toastManager.add({ title: flash.alert, type: "error" })
  if (flash.notice) toastManager.add({ title: flash.notice, type: "success" })
}

export function useFlash() {
  const { flash } = usePage()

  useEffect(() => {
    // setTimeout + cleanup prevents double-firing in React StrictMode
    const timeout = setTimeout(() => showFlash(flash), 0)
    return () => clearTimeout(timeout)
  }, [flash])
}
