import { Link, router } from "@inertiajs/react"
import { LogOut, Settings } from "lucide-react"

import {
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
} from "@/components/ui/menu"
import { UserInfo } from "@/components/user-info"
import { useMobileNavigation } from "@/hooks/use-mobile-navigation"
import { sessionPath, settingsProfilePath } from "@/routes"
import type { User } from "@/types"

interface UserMenuContentProps {
  auth: {
    session: {
      id: number
    }
    user: User
  }
}

export function UserMenuContent({ auth }: UserMenuContentProps) {
  const { session, user } = auth
  const cleanup = useMobileNavigation()

  const handleLogout = () => {
    cleanup()
    router.flushAll()
  }

  return (
    <>
      <MenuGroup>
        <MenuGroupLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-foreground text-sm">
            <UserInfo user={user} showEmail={true} />
          </div>
        </MenuGroupLabel>
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup>
        <MenuLinkItem
          render={
            <Link href={settingsProfilePath()} prefetch onClick={cleanup} />
          }
        >
          <Settings />
          Settings
        </MenuLinkItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuItem
        nativeButton
        render={
          <Link
            className="w-full"
            href={sessionPath(session.id)}
            method="delete"
            as="button"
            onClick={handleLogout}
          />
        }
      >
        <LogOut />
        Log out
      </MenuItem>
    </>
  )
}
