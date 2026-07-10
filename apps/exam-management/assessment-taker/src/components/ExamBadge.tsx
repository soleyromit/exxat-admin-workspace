/**
 * Exam-specific status badge.
 *
 * Wraps DS Badge (variant="secondary") so call sites that previously passed
 * bg/fg/dot color props continue to compile but the hardcoded colors are
 * dropped — all badges render with the DS secondary variant.
 */
import { Badge } from '@exxatdesignux/ui';
import { ReactNode } from 'react';

export interface ExamBadgeProps {
  bg?: string;   // kept for API compat but ignored
  fg?: string;   // kept for API compat but ignored
  dot?: string;  // kept for API compat but ignored
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ExamBadge({ children, title, className }: ExamBadgeProps) {
  return (
    <Badge variant="secondary" className={`text-xs font-semibold ${className ?? ''}`} title={title}>
      {children}
    </Badge>
  );
}
