import type { LucideIcon } from "lucide-react"

export interface Auth {
  user: CurrentUser
  session: Pick<Session, "id">
}

export interface BreadcrumbItem {
  title: string
  href: string
}

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon | null
  isActive?: boolean
}

export interface FlashData {
  alert?: string
  notice?: string
}

export interface SharedProps {
  auth: Auth
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  verified: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown // This allows for additional properties...
}

export interface CurrentUser extends User {
  is_owner: boolean
  // "resource.action" names; the owner gets ["*"]
  permissions: string[]
}

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string | null
}

// Permission.catalogue: resource => its permissions
export type PermissionCatalogue = Record<string, Permission[]>

export interface RoleOption {
  id: number
  name: string
  description?: string | null
}

export interface AdminRole {
  id: number
  name: string
  description: string | null
  permissions_count: number
  users_count: number
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role_id: number | null
  role_name: string | null
  is_owner: boolean
  pending: boolean
  created_at: string
}

export interface Session {
  id: number
  user_agent: string
  ip_address: string
  created_at: string
}
