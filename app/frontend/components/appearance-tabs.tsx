import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react"

import {
  RadioGroupPrimitive,
  RadioPrimitive,
} from "@/components/ui/radio-group"
import { type Appearance, useAppearance } from "@/hooks/use-appearance"
import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control"
import { cn } from "@/lib/utils"

const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

const itemClassName = segmentedControlItemVariants({ state: "checked" })

export default function AppearanceToggleTab({
  className,
}: {
  className?: string
}) {
  const { appearance, updateAppearance } = useAppearance()

  return (
    <RadioGroupPrimitive
      aria-label="Appearance"
      className={cn(segmentedControlRootClassName, className)}
      value={appearance}
      onValueChange={(value) => updateAppearance(value as Appearance)}
    >
      {tabs.map(({ value, icon: Icon, label }) => (
        <RadioPrimitive.Root
          key={value}
          className={itemClassName}
          value={value}
        >
          <Icon />
          {label}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  )
}
