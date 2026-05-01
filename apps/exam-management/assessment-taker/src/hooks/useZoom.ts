import { useState, useEffect, useCallback } from 'react';

export function useZoom() {
  const [zoomPercent, setZoomState] = useState<number>(() => {
    const stored = sessionStorage.getItem('exxat-exam-zoom');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 100 && parsed <= 400) {
        return parsed;
      }
    }
    return 100;
  });

  const [announcement, setAnnouncement] = useState('');

  const setZoom = useCallback((value: number, announce = false) => {
    const clamped = Math.max(100, Math.min(400, value));
    setZoomState(clamped);
    sessionStorage.setItem('exxat-exam-zoom', clamped.toString());

    if (announce) {
      setAnnouncement(`Text size changed to ${clamped}%`);
      // Clear announcement after a short delay so it can be re-announced if the value changes again
      setTimeout(() => setAnnouncement(''), 1000);
    }
  }, []);

  const zoomIn = useCallback((announce = false) => {
    setZoomState((prev) => {
      const next = Math.min(400, prev + 25);
      sessionStorage.setItem('exxat-exam-zoom', next.toString());
      if (announce) {
        setAnnouncement(`Text size changed to ${next}%`);
        setTimeout(() => setAnnouncement(''), 1000);
      }
      return next;
    });
  }, []);

  const zoomOut = useCallback((announce = false) => {
    setZoomState((prev) => {
      const next = Math.max(100, prev - 25);
      sessionStorage.setItem('exxat-exam-zoom', next.toString());
      if (announce) {
        setAnnouncement(`Text size changed to ${next}%`);
        setTimeout(() => setAnnouncement(''), 1000);
      }
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100, true);
  }, [setZoom]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + = or Ctrl + +
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn(true);
      }
      // Ctrl + -
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        zoomOut(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut]);

  const isHighZoom = zoomPercent >= 200;
  const isUltraZoom = zoomPercent >= 300;

  return {
    zoomPercent,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isHighZoom,
    isUltraZoom,
    announcement
  };
}