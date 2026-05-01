import React, { useEffect, useState, useRef } from 'react';
interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}
export function Tooltip({
  content,
  children,
  position = 'bottom',
  delay = 400
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({
    x: 0,
    y: 0
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const show = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      switch (position) {
        case 'top':
          setCoords({
            x: rect.left + rect.width / 2,
            y: rect.top - 8
          });
          break;
        case 'bottom':
          setCoords({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8
          });
          break;
        case 'left':
          setCoords({
            x: rect.left - 8,
            y: rect.top + rect.height / 2
          });
          break;
        case 'right':
          setCoords({
            x: rect.right + 8,
            y: rect.top + rect.height / 2
          });
          break;
      }
    }
  }, [visible, position]);
  const getTransformOrigin = () => {
    switch (position) {
      case 'top':
        return 'translateX(-50%) translateY(-100%)';
      case 'bottom':
        return 'translateX(-50%)';
      case 'left':
        return 'translateX(-100%) translateY(-50%)';
      case 'right':
        return 'translateY(-50%)';
    }
  };
  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}>
      
      {children}
      {visible &&
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: coords.x,
          top: coords.y,
          transform: getTransformOrigin()
        }}>
        
          <div
          className="px-3 py-2 rounded-lg text-xs font-heading font-medium max-w-[240px] text-center leading-snug shadow-lg border backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--surface-white)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-medium)',
            boxShadow:
            '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
            animation: 'tooltip-in 0.15s ease-out'
          }}>
          
            {content}
          </div>
        </div>
      }
    </div>);

}