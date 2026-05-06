import React, { useEffect, useState, useRef } from 'react';
import {
  Button as DSButton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Kbd as DSKbd,
} from '@exxat/ds/packages/ui/src';
export type ColorBlindMode =
'none' |
'protanopia' |
'deuteranopia' |
'tritanopia' |
'achromatopsia';
export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
  showQuestionNavInToolbar: boolean;
  onToggleNavInToolbar: () => void;
  showQuestionNavInHamburger: boolean;
  onToggleNavInHamburger: () => void;
  onToggleCalculator: () => void;
  onToggleKeyboard: () => void;
  onToggleAccessibility: () => void;
  zoomPercent: number;
  zoomIn: () => void;
  zoomOut: () => void;
  voiceNarrator: boolean;
  onToggleVoiceNarrator: () => void;
  onSubmit: () => void;
  colorBlindMode?: ColorBlindMode;
  onColorBlindModeChange?: (mode: ColorBlindMode) => void;
  onExit?: () => void;
}
export function SettingsPanel({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  onToggleCalculator,
  onToggleKeyboard,
  zoomPercent,
  zoomIn,
  zoomOut,
  voiceNarrator,
  onToggleVoiceNarrator,
  onSubmit,
  colorBlindMode = 'none',
  onColorBlindModeChange,
  onExit: _onExit
}: SettingsPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-[300px] rounded-xl shadow-lg py-2 z-50 animate-pop-in"
      style={{
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)'
      }}>
      
      {/* Theme Section */}
      <div
        className="px-4 py-3"
        style={{
          borderBottom: '1px solid var(--border)'
        }}>
        
        <div
          className="text-xs font-semibold mb-3 uppercase tracking-wider"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
          Theme
        </div>
        <div
          className="flex rounded-lg p-1"
          style={{
            backgroundColor: 'var(--muted)',
            border: '1px solid var(--border)'
          }}>
          
          <ThemeButton
            active={theme === 'light'}
            onClick={() => onThemeChange('light')}
            icon={<i className="fa-light fa-sun" aria-hidden="true" style={{ fontSize: 14 }} />}
            label="Light" />

          <ThemeButton
            active={theme === 'dark'}
            onClick={() => onThemeChange('dark')}
            icon={<i className="fa-light fa-moon" aria-hidden="true" style={{ fontSize: 14 }} />}
            label="Dark" />

          <ThemeButton
            active={theme === 'high-contrast'}
            onClick={() => onThemeChange('high-contrast')}
            icon={<i className="fa-light fa-circle-half-stroke" aria-hidden="true" style={{ fontSize: 14 }} />}
            label="Contrast" />
          
        </div>
      </div>

      {/* Tools Section */}
      <div
        style={{
          borderBottom: '1px solid var(--border)'
        }}>
        
        <SettingsItem
          icon={<i className="fa-light fa-calculator" aria-hidden="true" style={{ fontSize: 17 }} />}
          label="Calculator"
          onClick={() => {
            onToggleCalculator();
            onClose();
          }} />

        <SettingsItem
          icon={<i className="fa-light fa-keyboard" aria-hidden="true" style={{ fontSize: 17 }} />}
          label="Virtual Keyboard"
          onClick={() => {
            onToggleKeyboard();
            onClose();
          }} />
        
        <div
          className="px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-[var(--muted)] cursor-pointer"
          onClick={onToggleVoiceNarrator}>
          
          <div
            className="flex items-center gap-3 text-[13px] font-medium"
            style={{
              color: 'var(--foreground)'
            }}>
            
            <i className="fa-light fa-volume" aria-hidden="true" style={{ fontSize: 17, color: 'var(--muted-foreground)' }} />
            
            <span>Voice Narrator</span>
          </div>
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{
              backgroundColor: voiceNarrator ?
              'var(--exam-accent)' :
              'var(--border)'
            }}>
            
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
              style={{
                left: voiceNarrator ? '18px' : '2px'
              }} />
            
          </div>
        </div>
      </div>

      {/* Accessibility Section */}
      <div
        className="px-4 py-3"
        style={{
          borderBottom: '1px solid var(--border)'
        }}>
        
        <div
          className="text-xs font-semibold mb-3 uppercase tracking-wider"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
          Accessibility
        </div>

        {/* Zoom Control */}
        <div
          className="flex items-center justify-between py-2.5 transition-colors"
          style={{
            cursor: 'default'
          }}>
          
          <div className="flex items-center gap-3 text-[13px] font-medium">
            <i className="fa-light fa-magnifying-glass-plus" aria-hidden="true" style={{ fontSize: 17, color: 'var(--muted-foreground)' }} />
            
            <span>Text Size</span>
          </div>
          <div
            className="flex items-center gap-1 rounded-md p-0.5"
            style={{
              backgroundColor: 'var(--muted)',
              border: '1px solid var(--border)'
            }}>
            <DSButton
              variant="ghost"
              size="icon-xs"
              onClick={zoomOut}
              aria-label="Zoom out"
              title="Decrease text size"
            >
              <i className="fa-light fa-magnifying-glass-minus" aria-hidden="true" style={{ fontSize: 13 }} />
            </DSButton>
            <span
              className="text-xs font-mono w-11 text-center font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {zoomPercent}%
            </span>
            <DSButton
              variant="ghost"
              size="icon-xs"
              onClick={zoomIn}
              aria-label="Zoom in"
              title="Increase text size"
            >
              <i className="fa-light fa-magnifying-glass-plus" aria-hidden="true" style={{ fontSize: 13 }} />
            </DSButton>
          </div>
        </div>

        {/* Color Vision Mode */}
        <div
          className="py-2.5 flex items-center justify-between"
          style={{
            cursor: 'default'
          }}>
          
          <div
            className="flex items-center gap-3 text-[13px] font-medium"
            style={{
              color: 'var(--foreground)'
            }}>
            
            <i className="fa-light fa-eye" aria-hidden="true" style={{ fontSize: 17, color: 'var(--muted-foreground)' }} />
            
            <span>Color Vision</span>
          </div>
          <Select
            value={colorBlindMode}
            onValueChange={(v) => onColorBlindModeChange?.(v as ColorBlindMode)}
          >
            <SelectTrigger
              size="sm"
              className="w-[140px] text-[13px] font-medium"
              aria-label="Select color vision mode"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Normal</SelectItem>
              <SelectItem value="protanopia">Protanopia</SelectItem>
              <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
              <SelectItem value="tritanopia">Tritanopia</SelectItem>
              <SelectItem value="achromatopsia">Monochrome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div
        className="px-4 py-3"
        style={{
          borderBottom: '1px solid var(--border)'
        }}>
        
        <div
          className="text-xs font-semibold mb-3 uppercase tracking-wider"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
          Keyboard Shortcuts
        </div>
        <div className="flex flex-col gap-2">
          <ShortcutRow keys={['A', 'B', 'C', 'D']} label="Select answer" />
          <ShortcutRow keys={['←', '→']} label="Navigate questions" />
          <ShortcutRow keys={['Enter']} label="Next question" />
          <ShortcutRow keys={['Z']} label="Flag question" />
        </div>
      </div>

      {/* Submit Exam */}
      <div className="px-4 py-3">
        <SubmitButton onSubmit={onSubmit} onClose={onClose} />
      </div>
    </div>);

}
function ThemeButton({
  active,
  onClick,
  icon,
  label





}: {active: boolean;onClick: () => void;icon: React.ReactNode;label: string;}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
      style={{
        backgroundColor: active ? 'var(--brand-color)' : 'transparent',
        color: active ? 'var(--brand-foreground)' : 'var(--muted-foreground)',
        boxShadow: active ? '0 1px 2px var(--shadow-card, rgba(0,0,0,0.15))' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!active)
        (e.currentTarget as HTMLElement).style.backgroundColor =
        'var(--muted)';
      }}
      onMouseLeave={(e) => {
        if (!active)
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}>
      
      {icon}
      {label}
    </button>);

}
function SettingsItem({
  icon,
  label,
  onClick,
  shortcut





}: {icon: React.ReactNode;label: string;onClick: () => void;shortcut?: string;}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-2.5 transition-colors text-[13px] font-medium"
      style={{
        color: 'var(--foreground)'
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor =
        'var(--muted)';
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.backgroundColor = '';
      }}>
      
      <div className="flex items-center gap-3">
        <span
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {shortcut &&
      <span
        className="text-[10px] font-mono"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
          {shortcut}
        </span>
      }
    </button>);

}
function SubmitButton({
  onSubmit,
  onClose,
}: {
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-1.5">
        <p
          className="text-[10px] font-medium leading-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Submit exam? You cannot change answers after submission.
        </p>
        <div className="flex gap-1.5">
          <DSButton
            variant="default"
            size="sm"
            className="flex-1 font-bold"
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--brand-foreground)',
              borderColor: 'var(--brand-color)',
            }}
            onClick={() => {
              onClose();
              onSubmit();
            }}
          >
            Yes, Submit
          </DSButton>
          <DSButton
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </DSButton>
        </div>
      </div>
    );
  }

  return (
    <DSButton
      variant="default"
      size="default"
      className="w-full font-bold shadow-sm"
      style={{
        backgroundColor: 'var(--brand-color)',
        color: 'var(--brand-foreground)',
        borderColor: 'var(--brand-color)',
      }}
      onClick={() => setConfirming(true)}
    >
      <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 16 }} />
      Submit Exam
    </DSButton>
  );
}
function ShortcutRow({ keys, label }: {keys: string[];label: string;}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span
        className="text-[10px]"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
        {label}
      </span>
      <div className="flex gap-0.5">
        {keys.map((k, i) => (
          <DSKbd key={i}>{k}</DSKbd>
        ))}
      </div>
    </div>);

}