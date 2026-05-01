import React, { useEffect, useState, useRef } from 'react';
import { MinusIcon, PlusIcon, AArrowUpIcon, AArrowDownIcon } from 'lucide-react';
import { tokens } from '../tokens/design-tokens';
export interface ZoomControlProps {
  zoomPercent: number;
  setZoom: (val: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}
export function ZoomControl({
  zoomPercent,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  isOpen,
  setIsOpen
}: ZoomControlProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setIsOpen]);
  // Keyboard support for panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen, zoomIn, zoomOut]);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseInt(e.target.value, 10));
  };
  const ticks = [100, 150, 200, 300, 400];
  const sliderPercent = (zoomPercent - 100) / 300 * 100;
  return <div className="relative">
      {/* Trigger Button */}
      <button ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 relative group" style={{
      width: '44px',
      height: '44px',
      backgroundColor: isOpen ? tokens.brand.primaryBg : 'transparent',
      color: isOpen ? tokens.brand.primary : tokens.text.placeholder,
      outlineColor: tokens.brand.primary
    }} aria-label={`Text size (currently ${zoomPercent}%)`} aria-expanded={isOpen} aria-haspopup="dialog" title="Ctrl + = to increase, Ctrl + - to decrease">
        <div className="flex items-end gap-[1px]">
          <span className="font-heading font-bold" style={{
          fontSize: '12px'
        }}>
            A
          </span>
          <span className="font-heading font-bold" style={{
          fontSize: '18px',
          lineHeight: '18px'
        }}>
            A
          </span>
        </div>

        {/* Persistent Badge */}
        {zoomPercent > 100 && <span className="absolute -bottom-1 -right-1 font-heading font-bold rounded-full flex items-center justify-center" style={{
        backgroundColor: tokens.brand.primary,
        color: tokens.text.inverse,
        fontSize: '9px',
        padding: '2px 4px',
        border: `1px solid ${tokens.surface.white}`,
        lineHeight: 1
      }}>
            {zoomPercent}%
          </span>}
      </button>

      {/* Floating Panel */}
      {isOpen && <div ref={panelRef} className="absolute top-full mt-2 right-0 z-50 overflow-hidden" role="dialog" aria-label="Text size controls" style={{
      width: '280px',
      backgroundColor: tokens.surface.white,
      border: `1px solid ${tokens.border.default}`,
      borderRadius: '12px',
      // Using border instead of heavy shadow for lockdown browser compatibility
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
          {/* Header */}
          <div className="flex items-center justify-between" style={{
        padding: '12px 16px',
        backgroundColor: tokens.surface.subtle,
        borderBottom: `1px solid ${tokens.border.default}`
      }}>
            <span className="font-heading font-semibold" style={{
          fontSize: '14px',
          color: tokens.text.primary
        }}>
              Text size
            </span>
            <span className="font-heading font-bold" style={{
          fontSize: '14px',
          color: tokens.brand.primary
        }}>
              {zoomPercent}%
            </span>
          </div>

          {/* Controls */}
          <div style={{
        padding: '16px'
      }}>
            {/* Slider Row */}
            <div className="flex items-center justify-between mb-6" style={{
          gap: '12px'
        }}>
              <button onClick={zoomOut} disabled={zoomPercent <= 100} className="flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '32px',
            height: '32px',
            flexShrink: 0,
            border: `1px solid ${zoomPercent > 100 ? tokens.border.default : tokens.surface.subtle}`,
            color: zoomPercent > 100 ? tokens.text.secondary : tokens.text.placeholder,
            cursor: zoomPercent > 100 ? 'pointer' : 'not-allowed',
            outlineColor: tokens.brand.primary
          }} aria-label="Decrease text size">
                <span className="font-heading font-bold" style={{
              fontSize: '12px'
            }}>
                  A
                </span>
                <MinusIcon style={{
              width: '10px',
              height: '10px'
            }} />
              </button>

              <div className="relative flex-1 flex items-center h-8">
                {/* Custom Slider Track */}
                <div className="absolute w-full h-1 rounded-full pointer-events-none" style={{
              backgroundColor: tokens.border.default
            }}>
                  <div className="h-full rounded-full" style={{
                backgroundColor: tokens.brand.primary,
                width: `${sliderPercent}%`
              }} />
                </div>

                {/* Tick Marks */}
                <div className="absolute w-full flex justify-between px-[10px] pointer-events-none top-full mt-1">
                  {ticks.map((tick) => <div key={tick} className="flex flex-col items-center" style={{
                transform: 'translateX(-50%)'
              }}>
                      <div className="w-[1px] h-1 mb-1" style={{
                  backgroundColor: tokens.border.medium
                }} />
                      <span className="font-heading" style={{
                  fontSize: '10px',
                  color: tick === zoomPercent ? tokens.brand.primary : tokens.text.muted,
                  fontWeight: tick === zoomPercent ? 600 : 400
                }}>
                        {tick}
                      </span>
                    </div>)}
                </div>

                {/* Actual Input Range */}
                <input type="range" min="100" max="400" step="25" value={zoomPercent} onChange={handleSliderChange} className="absolute w-full h-full opacity-0 cursor-pointer" aria-label="Text size" aria-valuemin={100} aria-valuemax={400} aria-valuenow={zoomPercent} aria-valuetext={`${zoomPercent} percent`} />

                {/* Custom Thumb (visual only) */}
                <div className="absolute w-5 h-5 rounded-full shadow-sm pointer-events-none transition-transform" style={{
              backgroundColor: tokens.brand.primary,
              border: `2px solid ${tokens.surface.white}`,
              left: `calc(${sliderPercent}% - 10px)`
            }} />
              </div>

              <button onClick={zoomIn} disabled={zoomPercent >= 400} className="flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{
            width: '32px',
            height: '32px',
            flexShrink: 0,
            border: `1px solid ${zoomPercent < 400 ? tokens.border.default : tokens.surface.subtle}`,
            color: zoomPercent < 400 ? tokens.text.secondary : tokens.text.placeholder,
            cursor: zoomPercent < 400 ? 'pointer' : 'not-allowed',
            outlineColor: tokens.brand.primary
          }} aria-label="Increase text size">
                <span className="font-heading font-bold" style={{
              fontSize: '16px'
            }}>
                  A
                </span>
                <PlusIcon style={{
              width: '10px',
              height: '10px'
            }} />
              </button>
            </div>

            {/* Live Preview */}
            <div className="mt-8 mb-4 p-3 rounded-lg flex items-center justify-center overflow-hidden" style={{
          backgroundColor: tokens.surface.subtle,
          border: `1px solid ${tokens.border.default}`,
          minHeight: '60px'
        }} aria-hidden="true">
              <span className="font-heading text-center whitespace-nowrap" style={{
            fontSize: `${14 * (zoomPercent / 100)}px`,
            color: tokens.text.primary,
            lineHeight: 1.2
          }}>
                The quick brown fox
              </span>
            </div>

            {/* Reset Link */}
            <div className="text-center">
              <button onClick={resetZoom} disabled={zoomPercent === 100} className="font-heading text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-2 py-1" style={{
            color: zoomPercent === 100 ? tokens.text.placeholder : tokens.text.subtle,
            cursor: zoomPercent === 100 ? 'default' : 'pointer',
            outlineColor: tokens.brand.primary
          }}>
                Reset to default
              </button>
            </div>
          </div>
        </div>}
    </div>;
}