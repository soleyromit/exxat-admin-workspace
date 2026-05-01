import React from 'react';
import { XIcon, TypeIcon, ContrastIcon, MoveIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  zoomPercent: number;
  zoomIn: () => void;
  zoomOut: () => void;
}
export function AccessibilityPanel({
  isOpen,
  onClose,
  zoomPercent,
  zoomIn,
  zoomOut
}: AccessibilityPanelProps) {
  if (!isOpen) return null;
  return <div className="fixed top-20 right-20 z-50 animate-pop-in shadow-2xl rounded-2xl overflow-hidden border" style={{
    width: '320px',
    backgroundColor: tokens.surface.white,
    borderColor: tokens.border.default
  }}>
      <div className="flex justify-between items-center p-4 border-b" style={{
      backgroundColor: tokens.surface.subtle,
      borderColor: tokens.border.default
    }}>
        <span className="font-heading font-semibold text-sm flex items-center gap-2" style={{
        color: tokens.text.primary
      }}>
          <TypeIcon size={16} />
          Accessibility Options
        </span>
        <button onClick={onClose} className="hover:bg-slate-200 p-1 rounded transition-colors">
          <XIcon size={16} style={{
          color: tokens.text.muted
        }} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Text Size */}
        <div>
          <label className="block font-heading text-sm font-semibold mb-3 text-slate-700">
            Text Size
          </label>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border" style={{
          borderColor: tokens.border.default
        }}>
            <button onClick={zoomOut} className="w-10 h-10 flex items-center justify-center rounded bg-white border shadow-sm hover:bg-slate-50 transition-colors text-lg font-bold" style={{
            borderColor: tokens.border.default,
            color: tokens.text.primary
          }} aria-label="Decrease text size">
              A-
            </button>
            <div className="flex-1 text-center font-mono font-bold text-slate-700">
              {zoomPercent}%
            </div>
            <button onClick={zoomIn} className="w-10 h-10 flex items-center justify-center rounded bg-white border shadow-sm hover:bg-slate-50 transition-colors text-xl font-bold" style={{
            borderColor: tokens.border.default,
            color: tokens.text.primary
          }} aria-label="Increase text size">
              A+
            </button>
          </div>
        </div>

        {/* High Contrast (Mock) */}
        <div>
          <label className="flex items-center justify-between font-heading text-sm font-semibold text-slate-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <ContrastIcon size={16} />
              High Contrast
            </span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="contrast-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{
              borderColor: tokens.border.default
            }} />
              <label htmlFor="contrast-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
            </div>
          </label>
        </div>

        {/* Reduce Motion (Mock) */}
        <div>
          <label className="flex items-center justify-between font-heading text-sm font-semibold text-slate-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <MoveIcon size={16} />
              Reduce Motion
            </span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="motion-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{
              borderColor: tokens.border.default
            }} />
              <label htmlFor="motion-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
            </div>
          </label>
        </div>
      </div>
    </div>;
}