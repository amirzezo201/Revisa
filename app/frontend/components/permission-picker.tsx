import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { groupByArea, impliedViewIds, resourceLabel } from "@/lib/permissions"
import type { Permission, PermissionCatalogue } from "@/types"

interface PermissionPickerProps {
  catalogue: PermissionCatalogue
  selectedIds: number[]
  onChange: (ids: number[]) => void
  // Granted some other way (for example by the user's role): shown checked and locked.
  inheritedIds?: number[]
}

export function PermissionPicker({
  catalogue,
  selectedIds,
  onChange,
  inheritedIds = [],
}: PermissionPickerProps) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()

  const allIds = useMemo(
    () =>
      Object.values(catalogue)
        .flat()
        .map((permission) => permission.id),
    [catalogue],
  )

  const areas = useMemo(() => {
    if (!query) return groupByArea(catalogue)

    const visible: PermissionCatalogue = {}
    for (const [resource, permissions] of Object.entries(catalogue)) {
      const kept = permissions.filter((permission) =>
        [resourceLabel(resource), permission.description, permission.name]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      if (kept.length > 0) visible[resource] = kept
    }
    return groupByArea(visible)
  }, [catalogue, query])

  const toggle = (permission: Permission, siblings: Permission[]) => {
    if (selectedIds.includes(permission.id)) {
      onChange(selectedIds.filter((id) => id !== permission.id))
    } else {
      const granted = [...selectedIds, ...inheritedIds]
      onChange([
        ...selectedIds,
        permission.id,
        ...impliedViewIds(permission, siblings, granted),
      ])
    }
  }

  const toggleResource = (permissions: Permission[]) => {
    const ids = permissions.map((permission) => permission.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    onChange(
      allSelected
        ? selectedIds.filter((id) => !ids.includes(id))
        : [...new Set([...selectedIds, ...ids])],
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions"
            className="pl-8"
          />
        </div>
        <span className="text-muted-foreground text-sm tabular-nums">
          {selectedIds.length} of {allIds.length} granted
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(allIds)}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      </div>

      {areas.length === 0 && (
        <p className="py-10 text-center text-muted-foreground text-sm">
          Nothing matches "{search}".
        </p>
      )}

      {areas.map((area) => (
        <section key={area.key} className="rounded-lg border">
          <h3 className="border-b bg-muted/40 px-4 py-2 font-medium text-sm">
            {area.label}
          </h3>
          <div className="divide-y">
            {area.resources.map(({ resource, permissions }) => {
              const checkedCount = permissions.filter((permission) =>
                selectedIds.includes(permission.id),
              ).length

              return (
                <div
                  key={resource}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[10rem_1fr]"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`resource_${resource}`}
                      checked={checkedCount === permissions.length}
                      indeterminate={
                        checkedCount > 0 && checkedCount < permissions.length
                      }
                      onCheckedChange={() => toggleResource(permissions)}
                    />
                    <Label
                      htmlFor={`resource_${resource}`}
                      className="font-medium"
                    >
                      {resourceLabel(resource)}
                    </Label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {permissions.map((permission) => {
                      const inherited = inheritedIds.includes(permission.id)
                      const id = `permission_${permission.id}`

                      return (
                        <div key={permission.id} className="flex gap-2">
                          <Checkbox
                            id={id}
                            checked={
                              inherited || selectedIds.includes(permission.id)
                            }
                            disabled={inherited}
                            onCheckedChange={() =>
                              toggle(permission, permissions)
                            }
                          />
                          <Label
                            htmlFor={id}
                            className="font-normal leading-snug"
                          >
                            {permission.description ?? permission.name}
                            {inherited && (
                              <span className="text-muted-foreground">
                                {" "}
                                (from role)
                              </span>
                            )}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
