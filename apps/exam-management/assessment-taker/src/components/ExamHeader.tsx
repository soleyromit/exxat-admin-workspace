import React, { useEffect, useState, useRef } from 'react';
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
import { HelpCircleIcon, BellIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface ExamHeaderProps {
  timerFormatted: string;
  isUltraZoom?: boolean;
}
export function ExamHeader({
  timerFormatted,
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
            {/* Figma layer: "HelpButton" */}
            <button className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '44px',
            height: '32px',
            outlineColor: tokens.brand.primary
          }} aria-label="Help">
              {/* Figma layer: "HelpCircleIcon" */}
              <HelpCircleIcon style={{
              width: '20px',
              height: '20px',
              color: tokens.text.placeholder
            }} />
            </button>

            {/* Figma layer: "ChatButton" */}
            <button className="flex items-center justify-center rounded-md transition-colors overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '52px',
            height: '32px',
            outlineColor: tokens.brand.primary
          }} aria-label="Chat">
              <img src="/1-1273.png" alt="Chat" style={{
              width: '28px',
              height: '27px'
            }} />
            </button>

            {/* Figma layer: "NotificationButton" */}
            <button className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '39px',
            height: '32px',
            outlineColor: tokens.brand.primary
          }} aria-label="Notifications">
              {/* Figma layer: "BellIcon" */}
              <BellIcon style={{
              width: '15px',
              height: '17.5px',
              color: tokens.text.placeholder
            }} />
            </button>

            {/* Figma layer: "Divider" */}
            <div style={{
            borderLeft: `1px solid ${tokens.border.default}`,
            height: '32px',
            margin: '0 13px 0 8px'
          }} />

            {/* Figma layer: "AskLeoButton" */}
            <button className="flex items-center justify-center rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '120px',
            height: '32px',
            outlineColor: tokens.brand.primary
          }} aria-label="Ask Leo">
              <img src="/1-1282.png" alt="Ask Leo" style={{
              width: '120px',
              height: '32px'
            }} />
            </button>
          </> : <div className="relative" ref={moreRef}>
            <button onClick={() => setShowMore(!showMore)} className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 px-3" style={{
            height: '32px',
            outlineColor: tokens.brand.primary
          }} aria-label="More options" aria-expanded={showMore}>
              <span className="font-heading font-medium text-sm" style={{
              color: tokens.text.secondary
            }}>
                More
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
                <path d="M4 6L8 10L12 6" stroke={tokens.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showMore && <div className="absolute top-full right-0 mt-2 py-2 rounded-lg shadow-lg z-50 flex flex-col" style={{
            backgroundColor: tokens.surface.white,
            border: `1px solid ${tokens.border.default}`,
            width: '160px'
          }}>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <HelpCircleIcon style={{
                width: '16px',
                height: '16px',
                color: tokens.text.placeholder,
                marginRight: '8px'
              }} />
                  <span className="font-heading text-sm" style={{
                color: tokens.text.primary
              }}>
                    Help
                  </span>
                </button>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <BellIcon style={{
                width: '16px',
                height: '16px',
                color: tokens.text.placeholder,
                marginRight: '8px'
              }} />
                  <span className="font-heading text-sm" style={{
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
                  <span className="font-heading text-sm" style={{
                color: tokens.text.primary
              }}>
                    Chat
                  </span>
                </button>
                <button className="flex items-center px-4 py-2 hover:bg-slate-50 text-left w-full">
                  <span className="font-heading text-sm font-semibold" style={{
                color: tokens.brand.primary
              }}>
                    Ask Leo
                  </span>
                </button>
              </div>}
          </div>}

        {/* Figma layer: "UserProfile" */}
        <button className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
          height: '40px',
          padding: '0 12px',
          gap: '4px',
          outlineColor: tokens.brand.primary
        }}>
          {/* Figma layer: "UserLabel" */}
          <span className="font-heading" style={{
            fontSize: '14px',
            lineHeight: '20px',
            color: tokens.text.primary
          }}>
            Student2 PA2
          </span>
          {/* Figma layer: "ChevronIcon" */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke={tokens.text.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>);

}