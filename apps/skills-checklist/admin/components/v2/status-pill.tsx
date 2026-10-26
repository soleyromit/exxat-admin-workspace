import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { pillSpec, type PillKind, type PillValue } from "@/lib/v2/status-pill"

/**
 * The one renderer for a state in v2: the DS semantic StatusBadge with the word, tone and icon from lib/v2/status-pill.ts.
 * Never use Badge for a state. `label` overrides the word when a row has its own text (for example "In progress, 2 of 4");
 * the tone and icon still come from the table.
 */
export function StatusPill<K extends PillKind>({ kind, value, label, size = "sm", ...rest }: { kind: K; value: PillValue<K>; label?: string; size?: "sm" | "md" } & Omit<React.ComponentProps<"span">, "children">) {
  const spec = pillSpec(kind, value)
  return <StatusBadge label={label ?? spec.label} tone={spec.tone} icon={spec.icon} size={size} {...rest} />
}
