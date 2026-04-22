import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Mobile-only touch target: min 44×44px on mobile (WCAG 2.5.5), compact on desktop (md+). Use px to avoid rem scaling. */
export const touchTargetMobileClasses =
  "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation";
