import { usePage } from "@inertiajs/react"
import { ChevronsUpDown } from "lucide-react"

import { Menu, MenuPopup, MenuTrigger } from "@/components/ui/menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserInfo } from "@/components/user-info"
import { UserMenuContent } from "@/components/user-menu-content"
import { useIsMobile } from "@/hooks/use-media-query"

export function NavUser() {
  const { auth } = usePage().props
  const { state } = useSidebar()
  const isMobile = useIsMobile()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="group text-sidebar-accent-foreground data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <UserInfo user={auth.user} />
            <ChevronsUpDown className="ml-auto size-4" />
          </MenuTrigger>
          <MenuPopup
            className="w-(--anchor-width) min-w-56"
            align="end"
            side={
              isMobile ? "bottom" : state === "collapsed" ? "left" : "bottom"
            }
          >
            <UserMenuContent auth={auth} />
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
