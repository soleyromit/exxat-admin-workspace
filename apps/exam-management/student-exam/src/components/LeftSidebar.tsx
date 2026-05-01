import React from 'react';
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
import { FileEditIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface LeftSidebarProps {
  examTitle: string;
  attemptNumber: number;
}
export function LeftSidebar({
  examTitle,
  attemptNumber
}: LeftSidebarProps) {
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
        <button className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-100" style={{
          width: '32px',
          height: '32px'
        }} aria-label="Menu">
          {/* Figma layer: "MenuIcon" — custom SVG, convert to component in Figma */}
          <svg width="17.5" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M1 4H17M1 10H17M1 16H17" stroke={tokens.text.muted} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Figma layer: "ActiveExamTab"
             ⚠️ Full-bleed strip — borderRadius intentionally 0, clips to sidebar width */}
        <div className="flex items-center justify-center" style={{
          width: '62px',
          height: '40px',
          backgroundColor: tokens.sidebar.activeBg,
          borderRadius: 0
        }}>
          {/* Figma layer: "FileEditIcon" */}
          <FileEditIcon style={{
            width: '24px',
            height: '24px',
            color: tokens.text.inverse
          }} />
        </div>
      </div>
    </div>);

}