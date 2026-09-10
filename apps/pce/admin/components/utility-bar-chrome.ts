/**
 * Seam — see `@exxatdesignux/ui/components/shell/utility-bar-chrome`.
 *
 * The bar's chrome classes moved into the package because `AskLeoLauncher` needs
 * `askLeoLauncherChipClass` and this file is framework wiring: the first
 * consumer edit to any export here makes the whole file app-owned, and the chip
 * class then stops arriving with releases while the stylesheet that styles it
 * keeps shipping. Re-exporting means a local addition to the bar cannot starve
 * the launcher.
 *
 * Add app-only bar chrome below the re-export. Do not redefine
 * `askLeoLauncherChipClass` here.
 */
export * from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
