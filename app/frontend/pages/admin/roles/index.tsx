import { Head, Link } from "@inertiajs/react"
import { Plus } from "lucide-react"

import Heading from "@/components/heading"
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
import { adminRolesPath, editAdminRolePath, newAdminRolePath } from "@/routes"
import type { AdminRole, BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Roles", href: adminRolesPath() },
]

interface RolesIndexProps {
  roles: AdminRole[]
}

export default function RolesIndex({ roles }: RolesIndexProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Roles" />

      <div className="space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <Heading
            title="Roles"
            description="A role is a set of permissions. Everyone except the owner has one."
          />
          <Button render={<Link href={newAdminRolePath()} />}>
            <Plus />
            New role
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Permissions</TableHead>
              <TableHead className="text-right">People</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Link
                    href={editAdminRolePath(role.id)}
                    className="font-medium hover:underline"
                  >
                    {role.name}
                  </Link>
                  {role.description && (
                    <p className="max-w-xl whitespace-normal text-muted-foreground text-sm">
                      {role.description}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {role.permissions_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {role.users_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  )
}
