import React, { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'bottom',
  delay = 400,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const popupStyle = (): React.CSSProperties => {
    const GAP = 6;
    switch (position) {
      case 'top':    return { position: 'absolute', bottom: `calc(100% + ${GAP}px)`, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 };
      case 'bottom': return { position: 'absolute', top: `calc(100% + ${GAP}px)`,    left: '50%', transform: 'translateX(-50%)', zIndex: 9999 };
      case 'left':   return { position: 'absolute', right: `calc(100% + ${GAP}px)`,  top: '50%',  transform: 'translateY(-50%)', zIndex: 9999 };
      case 'right':  return { position: 'absolute', left: `calc(100% + ${GAP}px)`,   top: '50%',  transform: 'translateY(-50%)', zIndex: 9999 };
    }
  };

  return (
    <div
      className="inline-flex relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div className="pointer-events-none" style={popupStyle()}>
          <div
            className="px-3 py-1.5 rounded-md text-xs font-medium max-w-[240px] text-center leading-snug shadow-md border whitespace-nowrap"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              borderColor: 'var(--border)',
              animation: 'tooltip-in 0.12s ease-out',
            }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
