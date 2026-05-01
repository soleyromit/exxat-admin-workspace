import React from 'react';
/**
 * ExamInfoOverlay — Exxat Exam Management
 *
 * FIGMA LAYER GUIDE
 * ─────────────────
 * ExamInfoOverlay             [Frame, fixed full-screen, z=50]
 *   ├── Backdrop              [Rectangle, fill, bg=rgba(0,0,0,0.30), blur=4]
 *   └── Modal                 [Frame, Auto Layout vertical, 680px wide, bg=Surface/White, rounded-16]
 *         ├── Modal/Header    [Frame, Auto Layout horizontal, space-between, px=32px, pt=28px, pb=16px]
 *         │     ├── Header/Left [Frame, Auto Layout horizontal, gap=12px]
 *         │     │     ├── Modal/Title    [Text, 20px Bold, Text/Primary]
 *         │     │     └── AttemptBadge  [Frame, pill, border=Border/Medium, text=Text/Secondary]
 *         │     └── CloseButton         [Frame, 32×32, icon-button]
 *         │           └── XIcon         [Icon, 20×20, Text/Placeholder]
 *         └── Modal/Body      [Frame, Auto Layout vertical, px=32px, pb=28px, gap=24px]
 *               ├── Modal/Instructions  [Frame, Auto Layout vertical, gap=12px]
 *               │     ├── SectionLabel  [Text, 12px Bold uppercase, Text/Primary]
 *               │     └── InstructionBox [Frame, bg=Brand/PrimaryBg, border=Brand/PrimaryBorder, rounded-8px]
 *               ├── Modal/ExamDetails   [Frame, grid 4-col, gap=12px]
 *               │     └── StatCard ×4  [Frame, border=Border/Default, rounded-12, p=16px]
 *               │           ├── IconBadge [Frame, 36×36, rounded-8, bg={semantic color}]
 *               │           └── StatContent [Frame, Auto Layout vertical]
 *               │                 ├── StatLabel [Text, 12px, Text/Subtle]
 *               │                 └── StatValue [Text, 18px Bold, Text/Primary]
 *               ├── Modal/Description   [Frame, Auto Layout vertical, gap=12px]
 *               │     ├── SectionLabel  [Text, 12px Bold uppercase, Text/Primary]
 *               │     └── DescBox       [Frame, bg=Surface/Subtle, border=Border/Default]
 *               └── Modal/Footer        [Frame, justify=flex-end]
 *                     └── Button/Close  [Instance: Button, variant=primary]
 *
 * ⚠️ FIGMA EXPORT FLAGS
 *   1. Backdrop blur (backdrop-blur-sm) is a CSS filter — use Figma's Background Blur effect.
 *   2. Grid 4-col layout: use Figma Auto Layout with "Fixed width" children (wrap or manual).
 *
 * TOKEN USAGE
 *   modal bg         → Surface/White
 *   backdrop         → Surface/Overlay (rgba 0,0,0,0.30)
 *   instruction box  → Brand/PrimaryBg, Brand/PrimaryBorder
 *   stat card border → Border/Default
 *   icon badge bg    → Semantic/* (blue/green/amber/purple)
 */
import { XIcon, FileTextIcon, CheckCircleIcon, ClockIcon, ZapIcon } from 'lucide-react';
import { Button } from './Button';
import { tokens } from '../tokens/design-tokens';
export interface ExamInfoOverlayProps {
  onClose: () => void;
}
const STAT_CARDS = [{
  label: 'Total Points',
  value: '100',
  icon: FileTextIcon,
  iconColor: tokens.semantic.infoIcon,
  badgeBg: tokens.semantic.infoBg
}, {
  label: 'Passing Score',
  value: '70',
  icon: CheckCircleIcon,
  iconColor: tokens.semantic.successIcon,
  badgeBg: tokens.semantic.successBg
}, {
  label: 'Time Limit',
  value: '60 min',
  icon: ClockIcon,
  iconColor: tokens.semantic.amberIcon,
  badgeBg: tokens.semantic.amberBg
}, {
  label: 'Difficulty',
  value: 'Medium',
  icon: ZapIcon,
  iconColor: tokens.semantic.purpleIcon,
  badgeBg: tokens.semantic.purpleBg
}];
export function ExamInfoOverlay({
  onClose
}: ExamInfoOverlayProps) {
  return (
    // Figma layer: "ExamInfoOverlay"
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Figma layer: "Backdrop"
                     ⚠️ backdrop-blur-sm → Figma Background Blur effect (4px) */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{
        backgroundColor: tokens.surface.overlay
      }} onClick={onClose} />

      {/* Figma layer: "Modal" */}
      <div className="relative overflow-hidden" style={{
        backgroundColor: tokens.surface.white,
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '680px',
        margin: '0 16px'
      }}>
        {/* Figma layer: "Modal/Header" */}
        <div className="flex items-center justify-between" style={{
          padding: '28px 32px 16px'
        }}>
          {/* Figma layer: "Header/Left" */}
          <div className="flex items-center" style={{
            gap: '12px'
          }}>
            {/* Figma layer: "Modal/Title" */}
            <h2 className="font-heading font-bold" style={{
              fontSize: '20px',
              color: tokens.text.primary
            }}>
              Exam Information
            </h2>
            {/* Figma layer: "AttemptBadge" */}
            <span className="font-heading font-semibold" style={{
              fontSize: '12px',
              color: tokens.text.secondary,
              border: `1px solid ${tokens.border.medium}`,
              borderRadius: '9999px',
              padding: '3px 12px'
            }}>
              Attempt #3
            </span>
          </div>
          {/* Figma layer: "CloseButton" */}
          <button onClick={onClose} className="flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100" style={{
            width: '32px',
            height: '32px'
          }} aria-label="Close exam information">
            <XIcon style={{
              width: '20px',
              height: '20px',
              color: tokens.text.placeholder
            }} />
          </button>
        </div>

        {/* Figma layer: "Modal/Body" */}
        <div style={{
          padding: '0 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Figma layer: "Modal/Instructions" */}
          <div>
            <h3 className="font-heading font-bold" style={{
              fontSize: '12px',
              color: tokens.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Instructions
            </h3>
            {/* Figma layer: "InstructionBox" */}
            <div style={{
              backgroundColor: tokens.brand.primaryBg,
              border: `1px solid ${tokens.brand.primaryBorder}`,
              borderRadius: '8px',
              padding: '16px 20px'
            }}>
              <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0
              }}>
                <li className="flex items-start font-heading" style={{
                  gap: '8px',
                  fontSize: '14px',
                  color: tokens.text.secondary
                }}>
                  <span style={{
                    color: tokens.brand.primary,
                    marginTop: '6px',
                    fontSize: '12px'
                  }}>
                    •
                  </span>
                  Read each question carefully before attempting.
                </li>
              </ul>
            </div>
          </div>

          {/* Figma layer: "Modal/ExamDetails"
            ⚠️ 4-column grid — use Auto Layout with wrap or fixed-width children in Figma */}
          <div>
            <h3 className="font-heading font-bold" style={{
              fontSize: '12px',
              color: tokens.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Exam Details
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              {STAT_CARDS.map(({
                label,
                value,
                icon: Icon,
                iconColor,
                badgeBg
              }) =>
              // Figma layer: "StatCard"
              <div key={label} className="flex items-start" style={{
                border: `1px solid ${tokens.border.default}`,
                borderRadius: '12px',
                padding: '16px',
                gap: '12px'
              }}>
                    {/* Figma layer: "IconBadge" */}
                    <div className="flex items-center justify-center shrink-0" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: badgeBg
                }}>
                      <Icon style={{
                    width: '18px',
                    height: '18px',
                    color: iconColor
                  }} />
                    </div>
                    {/* Figma layer: "StatContent" */}
                    <div>
                      <p className="font-heading" style={{
                    fontSize: '12px',
                    color: tokens.text.subtle,
                    marginBottom: '2px'
                  }}>
                        {label}
                      </p>
                      <p className="font-heading font-bold" style={{
                    fontSize: '18px',
                    color: tokens.text.primary
                  }}>
                        {value}
                      </p>
                    </div>
                  </div>)}
            </div>
          </div>

          {/* Figma layer: "Modal/Description" */}
          <div>
            <h3 className="font-heading font-bold flex items-center" style={{
              fontSize: '12px',
              color: tokens.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              gap: '6px'
            }}>
              <FileTextIcon style={{
                width: '14px',
                height: '14px'
              }} />
              Description
            </h3>
            {/* Figma layer: "DescBox" */}
            <div style={{
              backgroundColor: tokens.surface.subtle,
              border: `1px solid ${tokens.border.default}`,
              borderRadius: '8px',
              padding: '16px 20px'
            }}>
              <p className="font-heading" style={{
                fontSize: '14px',
                color: tokens.text.secondary
              }}>
                Assessment on cell injury, inflammation, neoplasia, and basic
                histopathology.
              </p>
            </div>
          </div>

          {/* Figma layer: "Modal/Footer" */}
          <div className="flex justify-end">
            <Button label="Close" variant="primary" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>);

}