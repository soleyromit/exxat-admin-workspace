import type { ConditionalRule } from "@/components/table-properties/types"

/** First matching conditional rule background for a row (same logic as DataTable cells). */
export function getConditionalRowBackground<T extends Record<string, unknown>>(
  row: T,
  rules: ConditionalRule[] | undefined,
): string | undefined {
  if (!rules?.length) return undefined
  for (const rule of rules) {
    const cellVal = String(row[rule.fieldKey as keyof T] ?? "")
    const v = cellVal.trim()
    switch (rule.operator) {
      case "is":
        if (rule.values.length > 0 && rule.values.includes(v)) return rule.bgColor
        break
      case "is_not":
        if (rule.values.length > 0 && !rule.values.includes(v)) return rule.bgColor
        break
      case "contains":
        if (rule.values.length > 0 && rule.values.some(val => v.toLowerCase().includes(val.toLowerCase())))
          return rule.bgColor
        break
      case "not_contains":
        if (rule.values.length > 0 && !rule.values.some(val => v.toLowerCase().includes(val.toLowerCase())))
          return rule.bgColor
        break
      default:
        break
    }
  }
  return undefined
}
