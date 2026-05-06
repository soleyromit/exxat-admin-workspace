/**
 * ZoomChip — current text-size readout chip, only shown when zoomed past 100%.
 *
 * Click opens the accessibility / zoom panel.
 */

import { Button as DSButton } from '@exxat/ds/packages/ui/src';

export interface ZoomChipProps {
  zoomPercent: number;
  onClick: () => void;
}

export function ZoomChip({ zoomPercent, onClick }: ZoomChipProps) {
  if (zoomPercent <= 100) return null;

  return (
    <DSButton
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={`Text size is currently ${zoomPercent}%. Click to change.`}
      className="rounded-full mb-4 text-xs font-medium"
    >
      Text size: {zoomPercent}%
    </DSButton>
  );
}
