/**
 * Exam-specific status badge.
 *
 * Mirrors DS Badge shape (rounded-full pill + xs semibold) but accepts
 * inline bg/fg style props directly. Wraps a span (not a div) to be valid
 * inline-flow content. Standalone wrapper because studentUX `badge.tsx` has
 * a `style` prop type collision that conflicts with React.CSSProperties.
 */
import { ReactNode } from 'react';

export interface ExamBadgeProps {
  bg: string;
  fg: string;
  dot?: string;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ExamBadge({ bg, fg, dot, children, title, className }: ExamBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${className ?? ''}`}
      style={{ background: bg, color: fg, border: 'none' }}
      title={title}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />}
      {children}
    </span>
  );
}
