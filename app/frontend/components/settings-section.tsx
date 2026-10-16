import type { ReactNode } from "react"

import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card"

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

// A settings block in coss's CardFrame layout: title/description in the frame,
// the content in an inner card and actions in the frame footer.
export function SettingsSection({
  title,
  description,
  children,
  footer,
  className,
}: SettingsSectionProps) {
  return (
    <CardFrame className={className}>
      <CardFrameHeader>
        <CardFrameTitle className="font-heading text-base">
          {title}
        </CardFrameTitle>
        {description && (
          <CardFrameDescription>{description}</CardFrameDescription>
        )}
      </CardFrameHeader>
      <Card>
        <CardPanel>{children}</CardPanel>
      </Card>
      {footer && (
        <CardFrameFooter className="flex items-center gap-4">
          {footer}
        </CardFrameFooter>
      )}
    </CardFrame>
  )
}
