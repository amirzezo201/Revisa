import { Monitor, Moon, Sun } from "lucide-react"
import type { HTMLAttributes } from "react"

import { Button } from "@/components/ui/button"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"
import { useAppearance } from "@/hooks/use-appearance"

export default function AppearanceToggleDropdown({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { appearance, updateAppearance } = useAppearance()

  const getCurrentIcon = () => {
    switch (appearance) {
      case "dark":
        return <Moon />
      case "light":
        return <Sun />
      default:
        return <Monitor />
    }
  }

  return (
    <div className={className} {...props}>
      <Menu>
        <MenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Toggle theme" />
          }
        >
          {getCurrentIcon()}
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={() => updateAppearance("light")}>
            <Sun />
            Light
          </MenuItem>
          <MenuItem onClick={() => updateAppearance("dark")}>
            <Moon />
            Dark
          </MenuItem>
          <MenuItem onClick={() => updateAppearance("system")}>
            <Monitor />
            System
          </MenuItem>
        </MenuPopup>
      </Menu>
    </div>
  )
}
