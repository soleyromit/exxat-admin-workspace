import React from 'react';
import {
  Button as DSButton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ToggleGroup, ToggleGroupItem,
  ToggleSwitch,
} from '@exxatdesignux/ui';

export type ColorBlindMode =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

export interface SettingsPanelProps {
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
  return (
    <div
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-11 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
          Settings
        </span>
        <DSButton
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close settings"
        >
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </DSButton>
      </div>

      {/* Theme */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(v) => v && onThemeChange(v as 'light' | 'dark' | 'high-contrast')}
          className="w-full"
        >
          {(
            [
              { value: 'light', icon: 'fa-sun', label: 'Light' },
              { value: 'dark', icon: 'fa-moon', label: 'Dark' },
              { value: 'high-contrast', icon: 'fa-circle-half-stroke', label: 'Contrast' },
            ] as const
          ).map(({ value, icon, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={`${label} theme`}
              className="flex-1 gap-1.5 text-xs font-semibold"
            >
              <i className={`fa-light ${icon}`} aria-hidden="true" />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Display — text size + color vision */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Text size */}
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <i className="fa-light fa-text-size text-sm text-muted-foreground w-4 text-center shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              Text Size
            </span>
          </div>
          <div
            className="flex items-center gap-0.5 rounded-md"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', padding: 2 }}
          >
            <DSButton variant="ghost" size="icon-xs" onClick={zoomOut} aria-label="Decrease text size">
              <i className="fa-light fa-minus text-xs" aria-hidden="true" />
            </DSButton>
            <span
              className="text-[12px] font-mono font-semibold w-10 text-center"
              style={{ color: 'var(--foreground)' }}
            >
              {zoomPercent}%
            </span>
            <DSButton variant="ghost" size="icon-xs" onClick={zoomIn} aria-label="Increase text size">
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
            </DSButton>
          </div>
        </div>

        {/* Color vision */}
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <i className="fa-light fa-eye text-sm text-muted-foreground w-4 text-center shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>
              Color Vision
            </span>
          </div>
          <Select
            value={colorBlindMode}
            onValueChange={(v) => onColorBlindModeChange?.(v as ColorBlindMode)}
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
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <Row
          icon={<i className="fa-light fa-calculator text-sm" aria-hidden="true" />}
          label="Calculator"
          onClick={() => { onToggleCalculator(); onClose(); }}
        />
        <Row
          icon={<i className="fa-light fa-keyboard text-sm" aria-hidden="true" />}
          label="Virtual Keyboard"
          onClick={() => { onToggleKeyboard(); onClose(); }}
        />
        {/* Voice Narrator with DS ToggleSwitch */}
        <div className="w-full flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--muted-foreground)', width: 18, textAlign: 'center' }}>
              <i className="fa-light fa-volume" aria-hidden="true" />
            </span>
            <label htmlFor="narrator-toggle" className="text-[13px] font-medium cursor-pointer" style={{ color: 'var(--foreground)' }}>
              Voice Narrator
            </label>
          </div>
          <ToggleSwitch id="narrator-toggle" checked={voiceNarrator} onChange={onToggleVoiceNarrator} />
        </div>
      </div>

      {/* Keyboard shortcuts + Report */}
      {(onShowKeyboardShortcuts || onReportIssue) && (
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          {onShowKeyboardShortcuts && (
            <Row
              icon={<i className="fa-light fa-key text-sm" aria-hidden="true" />}
              label="Keyboard Shortcuts"
              onClick={() => { onShowKeyboardShortcuts(); onClose(); }}
              chevron
            />
          )}
          {onReportIssue && (
            <Row
              icon={<i className="fa-light fa-triangle-exclamation text-sm" aria-hidden="true" />}
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
          onClick={() => { onClose(); onSubmit(); }}
        >
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
    <DSButton
      variant="ghost"
      onClick={onClick}
      className="w-full justify-between px-4 h-11"
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
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
      )}
    </DSButton>
  );
}
