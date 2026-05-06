import { useEffect, useState, useRef } from 'react';
/**
 * ExamHeader — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * ExamHeader                      [Frame, Auto Layout horizontal, fill×48px]
 *   ├── Left/Logo                 [Frame, hug×hug]
 *   │     └── ExxatLogo           [Image, 30px height]
 *   └── Right/Actions             [Frame, Auto Layout horizontal, hug×hug, gap=0]
 *         ├── HelpButton          [Frame, 44×32, icon-button]
 *         │     └── HelpCircleIcon [Icon, 20×20, Text/Placeholder]
 *         ├── ChatButton          [Frame, 52×32, icon-button]
 *         │     └── ChatImage     [Image, 28×27]
 *         ├── NotificationButton  [Frame, 39×32, icon-button]
 *         │     └── BellIcon      [Icon, 15×17.5, Text/Placeholder]
 *         ├── Divider             [Rectangle, 1×32, Border/Default]
 *         └── AskLeoButton        [Frame, 120×32]
 *               └── AskLeoImage   [Image, 120×32]
 *         └── UserProfile         [Frame, Auto Layout horizontal, hug×40px]
 *               ├── UserLabel     [Text, 14px, Text/Primary]
 *               └── ChevronIcon   [Icon, 16×16, Text/Primary]
 *
 * ⚠️ FIGMA EXPORT FLAG
 *   ChatButton and AskLeoButton use image URLs from Magic Patterns CDN.
 *   Replace with Figma components/assets before handoff.
 *   UserProfile is a button with no avatar — add Avatar component in Figma.
 *
 * TOKEN USAGE
 *   bg           → Surface/White
 *   border-b     → Border/Default
 *   icon color   → Text/Placeholder (#9CA3AF)
 *   user text    → Text/Primary
 */
import { tokens } from '../tokens/design-tokens';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
export interface ExamHeaderProps {
  timerFormatted: string;
  isUltraZoom?: boolean;
}
export function ExamHeader({
  timerFormatted: _timerFormatted,
  isUltraZoom = false
}: ExamHeaderProps) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    if (showMore) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);
  return (
    // Figma layer: "ExamHeader"
    <header className="flex items-center justify-between z-30 relative" style={{
      height: '48px',
      backgroundColor: tokens.surface.white,
      borderBottom: `1px solid ${tokens.border.default}`,
      padding: '0 16px'
    }}>
      {/* Figma layer: "Left/Logo" */}
      <div className="flex items-center">
        <img src="/exxat_header_logo.svg" alt="Exxat" style={{
          height: '30px'
        }} />
      </div>

      {/* Figma layer: "Right/Actions" */}
      <div className="flex items-center" style={{
        gap: 0
      }}>
        {!isUltraZoom ? <>
            <DSButton variant="ghost" size="icon-sm" aria-label="Help">
              <i className="fa-light fa-circle-question" aria-hidden="true" style={{ fontSize: 18 }} />
            </DSButton>

            <DSButton variant="ghost" size="icon-sm" aria-label="Chat">
              <img src="/1-1273.png" alt="" aria-hidden="true" style={{ width: '24px', height: '23px' }} />
            </DSButton>

            <DSButton variant="ghost" size="icon-sm" aria-label="Notifications">
              <i className="fa-light fa-bell" aria-hidden="true" style={{ fontSize: 15 }} />
            </DSButton>

            {/* Figma layer: "Divider" */}
            <div style={{
            borderLeft: `1px solid ${tokens.border.default}`,
            height: '32px',
            margin: '0 13px 0 8px'
          }} />

            {/* Ask Leo — DS canonical pattern per CLAUDE.md */}
            <DSButton variant="outline" size="sm" aria-label="Ask Leo AI" className="gap-1.5 font-medium">
              <i
                className="fa-duotone fa-solid fa-star-christmas"
                aria-hidden="true"
                style={{ color: 'var(--brand-color)', fontSize: 12 }}
              />
              Ask Leo
            </DSButton>
          </> : <div className="relative" ref={moreRef}>
            <DSButton
              variant="ghost"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              aria-label="More options"
              aria-expanded={showMore}
              className="gap-1"
            >
              More
              <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 11 }} />
            </DSButton>

            {showMore && <div className="absolute top-full right-0 mt-2 py-2 rounded-lg shadow-lg z-50 flex flex-col" style={{
            backgroundColor: tokens.surface.white,
            border: `1px solid ${tokens.border.default}`,
            width: '160px'
          }}>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <i className="fa-light fa-circle-question" aria-hidden="true" style={{ fontSize: 16, color: tokens.text.placeholder, marginRight: '8px' }} />
                  <span className="text-sm" style={{
                color: tokens.text.primary
              }}>
                    Help
                  </span>
                </button>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <i className="fa-light fa-bell" aria-hidden="true" style={{ fontSize: 16, color: tokens.text.placeholder, marginRight: '8px' }} />
                  <span className="text-sm" style={{
                color: tokens.text.primary
              }}>
                    Notifications
                  </span>
                </button>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <img src="/1-1273.png" alt="Chat" style={{
                width: '16px',
                height: '16px',
                marginRight: '8px'
              }} />
                  <span className="text-sm" style={{
                color: tokens.text.primary
              }}>
                    Chat
                  </span>
                </button>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <span className="text-sm font-semibold" style={{
                color: tokens.brand.primary
              }}>
                    Ask Leo
                  </span>
                </button>
              </div>}
          </div>}

        <DSButton
          variant="ghost"
          size="sm"
          aria-label="Profile menu"
          className="gap-1.5"
        >
          <span className="text-sm">Student2 PA2</span>
          <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 11 }} />
        </DSButton>
      </div>
    </header>);

}