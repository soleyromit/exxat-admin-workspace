import React from 'react';
import { tokens } from '../tokens/design-tokens';
export interface ZoomChipProps {
  zoomPercent: number;
  onClick: () => void;
}
export function ZoomChip({
  zoomPercent,
  onClick
}: ZoomChipProps) {
  if (zoomPercent <= 100) return null;
  return <button onClick={onClick} className="inline-flex items-center rounded-full transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 mb-4" style={{
    backgroundColor: tokens.surface.subtle,
    border: `1px solid ${tokens.border.medium}`,
    padding: '4px 12px',
    outlineColor: tokens.brand.primary
  }} aria-label={`Text size is currently ${zoomPercent}%. Click to change.`}>
      <span className="font-heading font-medium" style={{
      fontSize: '12px',
      color: tokens.text.secondary
    }}>
        Text size: {zoomPercent}%
      </span>
    </button>;
}