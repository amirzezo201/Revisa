import type { CurrentUser, Permission, PermissionCatalogue } from "@/types"

// Hides UI the user can't use. The server checks every action regardless.
export function can(user: CurrentUser | null | undefined, name: string) {
  if (!user) return false
  return user.is_owner || user.permissions.includes(name)
}

export function canAny(
  user: CurrentUser | null | undefined,
  ...names: string[]
) {
  return names.some((name) => can(user, name))
}

export const resourceLabels: Record<string, string> = {
  sites: "Sites",
  pages: "Pages",
  drafts: "Drafts",
  revisions: "Versions",
  submissions: "Submissions",
  reviews: "Reviews",
  comments: "Comments",
  publications: "Hand-off",
  users: "Users",
}

export const AREAS = [
  { key: "content", label: "Content", resources: ["sites", "pages", "drafts"] },
  {
    key: "versions",
    label: "Versions",
    resources: ["revisions"],
  },
  {
    key: "review",
    label: "Review",
    resources: ["submissions", "reviews", "comments"],
  },
  { key: "handoff", label: "Hand-off", resources: ["publications"] },
  { key: "people", label: "People", resources: ["users"] },
]

export function resourceLabel(resource: string) {
  return resourceLabels[resource] ?? resource
}

export interface PermissionArea {
  key: string
  label: string
  resources: { resource: string; permissions: Permission[] }[]
}

// Groups the catalogue into AREAS. Resources the map doesn't know about land in
// a trailing "Other" area rather than vanishing.
export function groupByArea(catalogue: PermissionCatalogue): PermissionArea[] {
  const remaining = new Set(Object.keys(catalogue))
  const areas: PermissionArea[] = []

  for (const area of AREAS) {
    const resources = area.resources
      .filter((resource) => catalogue[resource])
      .map((resource) => {
        remaining.delete(resource)
        return { resource, permissions: catalogue[resource] }
      })
    if (resources.length > 0) areas.push({ ...area, resources })
  }

  if (remaining.size > 0) {
    areas.push({
      key: "other",
      label: "Other",
      resources: [...remaining]
        .sort()
        .map((resource) => ({ resource, permissions: catalogue[resource] })),
    })
  }

  return areas
}

const VIEW_ACTIONS = new Set(["index", "index_own", "show"])

// Doing something to a record implies being able to see it. Returns the ids of
// the view permissions to grant alongside `permission` that aren't granted yet.
export function impliedViewIds(
  permission: Permission,
  siblings: Permission[],
  selectedIds: number[],
): number[] {
  if (VIEW_ACTIONS.has(permission.action)) return []

  const find = (action: string) =>
    siblings.find((sibling) => sibling.action === action)
  const selected = (candidate?: Permission) =>
    candidate !== undefined && selectedIds.includes(candidate.id)

  const implied: number[] = []
  const index = find("index")
  const own = find("index_own")
  const show = find("show")

  if (!selected(index) && !selected(own)) {
    const view = permission.action.endsWith("_own")
      ? (own ?? index)
      : (index ?? own)
    if (view) implied.push(view.id)
  }
  if (show && !selected(show)) implied.push(show.id)

  return implied
}
