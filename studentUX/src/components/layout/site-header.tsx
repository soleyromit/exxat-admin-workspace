"use client";

export interface BreadcrumbItemType {
  label: string;
  onClick?: () => void;
}

interface SiteHeaderProps {
  currentPage: string;
  breadcrumbs?: BreadcrumbItemType[];
}

export function SiteHeader({ currentPage, breadcrumbs = [] }: SiteHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-[8px] transition-[width,height] ease-linear">
      <div className="flex items-center gap-2 px-4 flex-1 min-w-0" />
    </header>
  );
}
