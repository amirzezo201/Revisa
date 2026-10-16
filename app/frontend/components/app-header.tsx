import { Link, usePage } from "@inertiajs/react"
import { BookOpen, Folder, LayoutGrid, MenuIcon, Search } from "lucide-react"

import { Breadcrumbs } from "@/components/breadcrumbs"
import { Icon } from "@/components/icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Menu, MenuPopup, MenuTrigger } from "@/components/ui/menu"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserMenuContent } from "@/components/user-menu-content"
import { useInitials } from "@/hooks/use-initials"
import { cn } from "@/lib/utils"
import { dashboardPath } from "@/routes"
import type { BreadcrumbItem, NavItem } from "@/types"

import AppLogo from "./app-logo"
import AppLogoIcon from "./app-logo-icon"

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: dashboardPath(),
    icon: LayoutGrid,
  },
]

const rightNavItems: NavItem[] = [
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

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const page = usePage()
  const { auth } = page.props
  const getInitials = useInitials()
  return (
    <>
      <div className="border-sidebar-border/80 border-b">
        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Drawer position="left">
              <DrawerTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    aria-label="Open navigation menu"
                  />
                }
              >
                <MenuIcon />
              </DrawerTrigger>
              <DrawerPopup showCloseButton className="w-64 bg-sidebar">
                <DrawerHeader>
                  <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
                  <AppLogoIcon className="size-6 fill-current text-black dark:text-white" />
                </DrawerHeader>
                <DrawerPanel className="flex flex-1 flex-col justify-between">
                  <nav className="flex flex-col gap-1">
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "justify-start",
                        )}
                      >
                        {item.icon && <Icon iconNode={item.icon} />}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </nav>

                  <nav className="flex flex-col gap-1">
                    {rightNavItems.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "justify-start",
                        )}
                      >
                        {item.icon && <Icon iconNode={item.icon} />}
                        <span>{item.title}</span>
                      </a>
                    ))}
                  </nav>
                </DrawerPanel>
              </DrawerPopup>
            </Drawer>
          </div>

          <Link
            href={dashboardPath()}
            prefetch
            className="flex items-center space-x-2"
          >
            <AppLogo />
          </Link>

          {/* Desktop Navigation */}
          <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
            <nav className="flex h-full items-stretch gap-2">
              {mainNavItems.map((item) => (
                <div
                  key={item.title}
                  className="relative flex h-full items-center"
                >
                  <Link
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      page.url === item.href && "bg-accent",
                    )}
                  >
                    {item.icon && <Icon iconNode={item.icon} />}
                    {item.title}
                  </Link>
                  {page.url === item.href && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-foreground" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <div className="relative flex items-center space-x-1">
              <Button variant="ghost" size="icon" aria-label="Search">
                <Search />
              </Button>
              <div className="hidden lg:flex">
                {rightNavItems.map((item) => (
                  <TooltipProvider key={item.title} delay={0}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={item.title}
                            render={
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          />
                        }
                      >
                        {item.icon && <Icon iconNode={item.icon} />}
                      </TooltipTrigger>
                      <TooltipPopup>{item.title}</TooltipPopup>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="rounded-full"
                    aria-label="Open user menu"
                  />
                }
              >
                <Avatar className="size-8">
                  <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                  <AvatarFallback>{getInitials(auth.user.name)}</AvatarFallback>
                </Avatar>
              </MenuTrigger>
              <MenuPopup className="w-56" align="end">
                <UserMenuContent auth={auth} />
              </MenuPopup>
            </Menu>
          </div>
        </div>
      </div>
      {breadcrumbs.length > 1 && (
        <div className="flex w-full border-sidebar-border/70 border-b">
          <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-muted-foreground md:max-w-7xl">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </>
  )
}
