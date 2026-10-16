import { Head } from "@inertiajs/react"

import AppearanceTabs from "@/components/appearance-tabs"
import { SettingsSection } from "@/components/settings-section"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { settingsAppearancePath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Appearance settings",
    href: settingsAppearancePath(),
  },
]

export default function Appearance() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <SettingsSection
          title="Appearance settings"
          description="Update your account's appearance settings"
        >
          <AppearanceTabs />
        </SettingsSection>
      </SettingsLayout>
    </AppLayout>
  )
}
