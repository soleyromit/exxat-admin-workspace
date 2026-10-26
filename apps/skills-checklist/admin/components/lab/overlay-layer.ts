/**
 * Stacking for lab dialogs opened from inside a DS FloatingSheetPanel (the rail sits at z-80, its own popovers at z-90; a DS
 * Dialog and Select default to z-50, so they open under the panel and long names are cut off). The DS package is not edited:
 * a dialog that can open over a panel takes these classes on its content and overlay, and any Select inside it takes the menu
 * class, so the menu sits above its dialog. Same approach as the add-skill sheet's guard (components/lab/library/skill-sheet.tsx).
 */
export const ABOVE_PANEL = "z-[95]"
export const ABOVE_PANEL_MENU = "z-[96]"
