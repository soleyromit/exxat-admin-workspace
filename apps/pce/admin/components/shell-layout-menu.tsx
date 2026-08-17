"use client"

/**
 * Shell layout menu — retired.
 *
 * Compact is the only shell. Kept as a null export so profile menus that still
 * import `ShellLayoutMenu` do not break during the upgrade window; remove the
 * call sites when syncing.
 */

export function ShellLayoutMenu() {
  return null
}
