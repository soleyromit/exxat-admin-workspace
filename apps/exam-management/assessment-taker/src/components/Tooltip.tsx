import React from 'react';
import {
  Tooltip as DSTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@exxatdesignux/ui';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  /** Delay before tooltip appears (ms). Default 400. */
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'bottom',
  disabled = false,
  delay = 400,
}: TooltipProps) {
  if (disabled) return children;
  return (
    <TooltipProvider delayDuration={delay}>
      <DSTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={position}>{content}</TooltipContent>
      </DSTooltip>
    </TooltipProvider>
  );
}
