import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RoleOption } from "@/types"

interface RoleSelectProps {
  roles: RoleOption[]
  value: number | null
  onChange: (roleId: number | null) => void
  disabled?: boolean
}

export function RoleSelect({
  roles,
  value,
  onChange,
  disabled,
}: RoleSelectProps) {
  const items = [
    { value: "", label: "No role (no access)" },
    ...roles.map((role) => ({ value: String(role.id), label: role.name })),
  ]

  return (
    <Select
      items={items}
      value={value === null ? "" : String(value)}
      onValueChange={(next) => onChange(next ? Number(next) : null)}
      disabled={disabled}
    >
      <SelectTrigger id="role_id">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}
