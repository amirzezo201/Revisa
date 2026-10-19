import { usePage } from "@inertiajs/react"

import { can } from "@/lib/permissions"

export function useCan() {
  const { auth } = usePage().props
  return (name: string) => can(auth.user, name)
}
