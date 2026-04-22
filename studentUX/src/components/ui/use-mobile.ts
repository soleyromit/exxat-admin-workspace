import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** lg breakpoint — tablet and below use mobile-style layout (e.g. hamburger menu) */
const DESKTOP_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/** True when viewport is in landscape (width > height). Used for mobile layout adjustments. */
export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)");
    const onChange = () => setIsLandscape(mql.matches);
    mql.addEventListener("change", onChange);
    setIsLandscape(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLandscape;
}

/** True when viewport is desktop (lg and up). Tablet and mobile use compact/menu layout. */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}
