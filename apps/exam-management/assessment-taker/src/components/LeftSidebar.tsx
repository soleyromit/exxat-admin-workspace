
/**
 * LeftSidebar — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * LeftSidebar                 [Frame, Auto Layout vertical, 64px×fill]
 *   └── SidebarContent        [Frame, Auto Layout vertical, fill×hug, pt-8px, gap-8px]
 *         ├── MenuButton      [Frame, 32×32, icon-button, centered]
 *         │     └── MenuIcon  [Vector, 17.5×20, Text/Muted]
 *         └── ActiveExamTab   [Frame, 62×40, bg=Sidebar/ActiveBg, no radius]
 *               └── FileEditIcon [Icon, 24×24, Text/Inverse]
 *
 * TOKEN USAGE
 *   bg          → Surface/White
 *   border-r    → Border/Default
 *   active tab  → Sidebar/ActiveBg (#DB2777)
 *   icon        → Text/Inverse
 *
 * ⚠️ FIGMA EXPORT FLAG
 *   ActiveExamTab has borderRadius=0 (full-bleed strip). In Figma, ensure
 *   this frame has "Clip content" on and no corner radius to match intent.
 */
import { tokens } from '../tokens/design-tokens';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
export interface LeftSidebarProps {
  examTitle: string;
  attemptNumber: number;
}
export function LeftSidebar(_props: LeftSidebarProps) {
  return (
    // Figma layer: "LeftSidebar"
    <div className="flex flex-col shrink-0" style={{
      width: '64px',
      backgroundColor: tokens.surface.white,
      borderRight: `1px solid ${tokens.border.default}`
    }}>
      {/* Figma layer: "SidebarContent" */}
      <div className="flex flex-col items-center" style={{
        paddingTop: '8px',
        gap: '8px'
      }}>
        {/* Figma layer: "MenuButton" */}
        <DSButton variant="ghost" size="icon-sm" aria-label="Menu">
          <i className="fa-light fa-bars" aria-hidden="true" style={{ fontSize: 18 }} />
        </DSButton>

        {/* Figma layer: "ActiveExamTab"
             ⚠️ Full-bleed strip — borderRadius intentionally 0, clips to sidebar width */}
        <div className="flex items-center justify-center" style={{
          width: '62px',
          height: '40px',
          backgroundColor: tokens.sidebar.activeBg,
          borderRadius: 0
        }}>
          <i className="fa-light fa-file-pen" aria-hidden="true" style={{ fontSize: 24, color: tokens.text.inverse }} />
        </div>
      </div>
    </div>);

}