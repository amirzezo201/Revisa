import { Head, Link, usePage } from "@inertiajs/react"

import { SettingsSection } from "@/components/settings-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { sessionPath, settingsSessionsPath } from "@/routes"
import type { BreadcrumbItem, Session } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Sessions",
    href: settingsSessionsPath(),
  },
]

interface SessionsProps {
  sessions: Session[]
}

export default function Sessions({ sessions }: SessionsProps) {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <SettingsSection
          title="Sessions"
          description="Manage your active sessions across devices"
        >
          <ul className="-my-4 divide-y">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 font-medium text-sm">
                    <span className="truncate">{session.user_agent}</span>
                    {session.id === auth.session.id && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    IP: {session.ip_address} · Active since{" "}
                    {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                {session.id !== auth.session.id && (
                  <Button
                    variant="destructive-outline"
                    size="sm"
                    render={
                      <Link
                        href={sessionPath(session.id)}
                        method="delete"
                        as="button"
                      />
                    }
                  >
                    Log out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </SettingsSection>
      </SettingsLayout>
    </AppLayout>
  )
}
