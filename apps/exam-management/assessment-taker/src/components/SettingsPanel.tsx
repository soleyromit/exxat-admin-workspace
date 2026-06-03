import React, { useEffect, useRef, useState } from 'react';
import {
  Button as DSButton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@exxatdesignux/ui';

export type ColorBlindMode =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
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
  onShowKeyboardShortcuts?: () => void;
  onReportIssue?: () => void;
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
  onShowKeyboardShortcuts,
  onReportIssue,
}: SettingsPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) { setSelectOpen(false); }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectOpen) return;
      const target = event.target as Element;
      if (ref.current && !ref.current.contains(target)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, selectOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-[300px] rounded-xl shadow-lg z-50 animate-pop-in overflow-hidden"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-11"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
          Settings
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-[var(--muted)]"
          aria-label="Close settings"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Theme */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="flex rounded-lg p-[3px]"
          style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {(
            [
              { value: 'light', icon: 'fa-sun', label: 'Light' },
              { value: 'dark', icon: 'fa-moon', label: 'Dark' },
              { value: 'high-contrast', icon: 'fa-circle-half-stroke', label: 'Contrast' },
            ] as const
          ).map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => onThemeChange(value)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={
                theme === value
                  ? {
                      backgroundColor: 'var(--brand-color)',
                      color: 'var(--brand-foreground)',
                    }
                  : { color: 'var(--muted-foreground)' }
              }
              aria-pressed={theme === value}
              aria-label={`${label} theme`}
            >
              <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Display — text size + color vision */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Text size */}
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <i className="fa-light fa-text-size" aria-hidden="true" style={{ fontSize: 15, color: 'var(--muted-foreground)', width: 18, textAlign: 'center' }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              Text Size
            </span>
          </div>
          <div
            className="flex items-center gap-0.5 rounded-md"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', padding: 2 }}
          >
            <DSButton variant="ghost" size="icon-xs" onClick={zoomOut} aria-label="Decrease text size">
              <i className="fa-light fa-minus" aria-hidden="true" style={{ fontSize: 12 }} />
            </DSButton>
            <span
              className="text-[12px] font-mono font-semibold w-10 text-center"
              style={{ color: 'var(--foreground)' }}
            >
              {zoomPercent}%
            </span>
            <DSButton variant="ghost" size="icon-xs" onClick={zoomIn} aria-label="Increase text size">
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
            </DSButton>
          </div>
        </div>

        {/* Color vision */}
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <i className="fa-light fa-eye" aria-hidden="true" style={{ fontSize: 15, color: 'var(--muted-foreground)', width: 18, textAlign: 'center' }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              Color Vision
            </span>
          </div>
          <Select
            value={colorBlindMode}
            onValueChange={(v) => onColorBlindModeChange?.(v as ColorBlindMode)}
            onOpenChange={setSelectOpen}
          >
            <SelectTrigger
              size="sm"
              className="w-[120px] text-[12px]"
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

      {/* Tools */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <Row
          icon={<i className="fa-light fa-calculator" aria-hidden="true" style={{ fontSize: 15 }} />}
          label="Calculator"
          onClick={() => { onToggleCalculator(); onClose(); }}
        />
        <Row
          icon={<i className="fa-light fa-keyboard" aria-hidden="true" style={{ fontSize: 15 }} />}
          label="Virtual Keyboard"
          onClick={() => { onToggleKeyboard(); onClose(); }}
        />
        {/* Voice Narrator with toggle */}
        <button
          className="w-full flex items-center justify-between px-4 h-11 transition-colors hover:bg-[var(--muted)]"
          onClick={onToggleVoiceNarrator}
          role="switch"
          aria-checked={voiceNarrator}
          aria-label="Voice Narrator"
        >
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--muted-foreground)', width: 18, textAlign: 'center' }}>
              <i className="fa-light fa-volume" aria-hidden="true" style={{ fontSize: 15 }} />
            </span>
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              Voice Narrator
            </span>
          </div>
          {/* Toggle pill */}
          <div
            className="relative flex-shrink-0 rounded-full transition-colors"
            style={{
              width: 32,
              height: 18,
              backgroundColor: voiceNarrator ? 'var(--brand-color)' : 'var(--border)',
            }}
          >
            <div
              className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform"
              style={{ left: voiceNarrator ? 16 : 2 }}
            />
          </div>
        </button>
      </div>

      {/* Keyboard shortcuts + Report */}
      {(onShowKeyboardShortcuts || onReportIssue) && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          {onShowKeyboardShortcuts && (
            <Row
              icon={<i className="fa-light fa-key" aria-hidden="true" style={{ fontSize: 15 }} />}
              label="Keyboard Shortcuts"
              onClick={() => { onShowKeyboardShortcuts(); onClose(); }}
              chevron
            />
          )}
          {onReportIssue && (
            <Row
              icon={<i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 15 }} />}
              label="Report an issue"
              onClick={() => { onReportIssue(); onClose(); }}
              chevron
            />
          )}
        </div>
      )}

      {/* Submit */}
      <div className="px-4 py-3">
        <DSButton
          variant="default"
          size="default"
          className="w-full font-semibold"
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'var(--brand-foreground)',
            borderColor: 'var(--brand-color)',
          }}
          onClick={() => { onClose(); onSubmit(); }}
        >
          <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 14 }} />
          Submit Exam
        </DSButton>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  onClick,
  chevron = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  chevron?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 h-11 transition-colors hover:bg-[var(--muted)] text-left"
    >
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--muted-foreground)', width: 18, textAlign: 'center' as const }}>
          {icon}
        </span>
        <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      </div>
      {chevron && (
        <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
      )}
    </button>
  );
}
