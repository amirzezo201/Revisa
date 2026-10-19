import { Head, Link, router } from "@inertiajs/react"
import { Plus } from "lucide-react"

import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import {
  adminUserInvitationPath,
  adminUsersPath,
  editAdminUserPath,
  newAdminUserPath,
} from "@/routes"
import type { AdminUser, BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "People", href: adminUsersPath() },
]

interface UsersIndexProps {
  users: AdminUser[]
  can_invite: boolean
}

export default function UsersIndex({ users, can_invite }: UsersIndexProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="People" />

      <div className="space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <Heading
            title="People"
            description="Your team and your clients. What each person can do comes from their role."
          />
          {can_invite && (
            <Button render={<Link href={newAdminUserPath()} />}>
              <Plus />
              Invite
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    href={editAdminUserPath(user.id)}
                    className="font-medium hover:underline"
                  >
                    {user.name}
                  </Link>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </TableCell>
                <TableCell>
                  {user.is_owner ? (
                    <Badge>Owner</Badge>
                  ) : (
                    (user.role_name ?? (
                      <span className="text-muted-foreground">No role</span>
                    ))
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {user.pending && (
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="outline">Invited</Badge>
                      {can_invite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.post(adminUserInvitationPath(user.id))
                          }
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  )
}
