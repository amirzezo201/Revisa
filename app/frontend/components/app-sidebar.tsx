import { Link, usePage } from "@inertiajs/react"
import { BookOpen, Folder, LayoutGrid, ShieldCheck, Users } from "lucide-react"

import { NavFooter } from "@/components/nav-footer"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { can } from "@/lib/permissions"
import { adminRolesPath, adminUsersPath, dashboardPath } from "@/routes"
import type { NavItem } from "@/types"

import AppLogo from "./app-logo"

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: dashboardPath(),
    icon: LayoutGrid,
  },
]

const footerNavItems: NavItem[] = [
  {
    title: "Repository",
    href: "https://github.com/amirzezo201/rails-inertia-boilerplate",
    icon: Folder,
  },
  {
    title: "Documentation",
    href: "https://inertia-rails.dev",
    icon: BookOpen,
  },
]

export function AppSidebar() {
  const { auth } = usePage().props
  const adminNavItems: NavItem[] = [
    ...(can(auth.user, "users.index")
      ? [{ title: "People", href: adminUsersPath(), icon: Users }]
      : []),
    // Roles are owner-only (RolePolicy), not delegated through a permission.
    ...(auth.user.is_owner
      ? [{ title: "Roles", href: adminRolesPath(), icon: ShieldCheck }]
      : []),
  ]

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={dashboardPath()} prefetch />}
            >
              <AppLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
        {adminNavItems.length > 0 && (
          <NavMain label="Admin" items={adminNavItems} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
