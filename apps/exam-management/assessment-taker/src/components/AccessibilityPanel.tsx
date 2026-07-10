import { Button as DSButton, ToggleSwitch } from '@exxatdesignux/ui';

export interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  zoomPercent: number;
  zoomIn: () => void;
  zoomOut: () => void;
  highContrast: boolean;
  onHighContrastChange: (v: boolean) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (v: boolean) => void;
}

export function AccessibilityPanel({
  isOpen,
  onClose,
  zoomPercent,
  zoomIn,
  zoomOut,
  highContrast,
  onHighContrastChange,
  reduceMotion,
  onReduceMotionChange,
}: AccessibilityPanelProps) {

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-20 right-20 z-50 animate-pop-in shadow-lg rounded-lg overflow-hidden border"
      style={{
        width: '320px',
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Accessibility options"
    >
      <div
        className="flex justify-between items-center p-4 border-b"
        style={{
          backgroundColor: 'var(--muted)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
          <i className="fa-light fa-universal-access" aria-hidden="true" style={{ fontSize: 16 }} />
          Accessibility Options
        </span>
        <DSButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close accessibility panel">
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
        </DSButton>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Text Size */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-foreground">
            Text Size
          </label>
          <div
            className="flex items-center gap-4 bg-muted p-2 rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          >
            <DSButton
              variant="outline"
              size="icon"
              onClick={zoomOut}
              aria-label="Decrease text size"
              className="font-bold text-lg shadow-sm"
            >
              A-
            </DSButton>
            <div className="flex-1 text-center font-mono font-bold text-foreground">
              {zoomPercent}%
            </div>
            <DSButton
              variant="outline"
              size="icon"
              onClick={zoomIn}
              aria-label="Increase text size"
              className="font-bold text-xl shadow-sm"
            >
              A+
            </DSButton>
          </div>
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <label htmlFor="contrast-toggle" className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
            <i className="fa-light fa-circle-half-stroke" aria-hidden="true" style={{ fontSize: 16 }} />
            High Contrast
          </label>
          <ToggleSwitch
            id="contrast-toggle"
            checked={highContrast}
            onChange={onHighContrastChange}
          />
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between">
          <label htmlFor="motion-toggle" className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
            <i className="fa-light fa-arrows-up-down-left-right" aria-hidden="true" style={{ fontSize: 16 }} />
            Reduce Motion
          </label>
          <ToggleSwitch
            id="motion-toggle"
            checked={reduceMotion}
            onChange={onReduceMotionChange}
          />
        </div>
      </div>
    </div>
  );
}