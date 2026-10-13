import { dailyCap } from "./guards"

/** True when a key is configured (or the test-only mock transport is on). The key itself is never exposed. */
export function hasKey(): boolean {
  if (process.env.TYPESAFE_MOCK === "1") return true
  return (process.env.TYPESAFE_API_KEY ?? "").trim().length > 0
}

/**
 * Whether the AI assist can be offered. SKILLS_IMPORT_AI=off disables it explicitly; otherwise a configured key is the opt-in
 * (the admin still chooses per import with the switch, default off). [INFER: the design's "on" flag is implied by the key.]
 */
export function aiAvailable(): boolean {
  if ((process.env.SKILLS_IMPORT_AI ?? "").trim().toLowerCase() === "off") return false
  return hasKey() && !dailyCap.reached()
}
