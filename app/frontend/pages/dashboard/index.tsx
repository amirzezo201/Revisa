import { Head } from "@inertiajs/react"

import { PlaceholderPattern } from "@/components/placeholder-pattern"
import { Card } from "@/components/ui/card"
import AppLayout from "@/layouts/app-layout"
import { dashboardPath } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: dashboardPath(),
  },
]

export default function Dashboard() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Card className="relative aspect-video overflow-hidden">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-foreground/10" />
          </Card>
          <Card className="relative aspect-video overflow-hidden">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-foreground/10" />
          </Card>
          <Card className="relative aspect-video overflow-hidden">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-foreground/10" />
          </Card>
        </div>
        <Card className="relative min-h-[100vh] flex-1 overflow-hidden md:min-h-min">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-foreground/10" />
        </Card>
      </div>
    </AppLayout>
  )
}
