import React from 'react';
import {
  Tooltip as DSTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@exxatdesignux/ui';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'bottom',
  disabled = false,
}: TooltipProps) {
  if (disabled) return children;
  return (
    <DSTooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={position}>{content}</TooltipContent>
    </DSTooltip>
  );
}
