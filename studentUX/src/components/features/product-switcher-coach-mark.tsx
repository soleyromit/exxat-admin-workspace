"use client";

import * as React from "react";
import { ProductSwitcher, type ProductSwitcherPlacement } from "@/components/layout/product-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import { cn } from "@/components/ui/utils";
import { useAppStore } from "@/stores/app-store";
import exxatPrismLogo from "../../../Illustration/Exxat_Prism.svg";

const STORAGE_KEY = "exxat_product_switcher_coach_mark_dismissed";
const EXXAT_PRISM_URL = "https://exxat.com/products/exxat-prism";

export function ProductSwitcherWithCoachMark({
  className,
  placement = "icon-next-to-help",
}: {
  className?: string;
  placement?: ProductSwitcherPlacement;
}) {
  const forceShow = useAppStore((s) => s.showProductSwitcherCoachMark);
  const setShowProductSwitcherCoachMark = useAppStore((s) => s.setShowProductSwitcherCoachMark);
  const ignoreDismissRef = React.useRef(false);

  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [open, setOpen] = React.useState(!dismissed);

  React.useEffect(() => {
    if (forceShow) {
      localStorage.removeItem(STORAGE_KEY);
      setDismissed(false);
      setOpen(true);
      setShowProductSwitcherCoachMark(false);
      ignoreDismissRef.current = true;
      const id = setTimeout(() => {
        ignoreDismissRef.current = false;
      }, 400);
      return () => clearTimeout(id);
    }
  }, [forceShow, setShowProductSwitcherCoachMark]);

  const dismiss = () => {
    setDismissed(true);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
    setShowProductSwitcherCoachMark(false);
  };

  const handleSkip = () => dismiss();

  const handleOpenPrism = () => {
    dismiss();
    window.open(EXXAT_PRISM_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (ignoreDismissRef.current) {
        setOpen(true);
        return;
      }
      dismiss();
    } else {
      setOpen(newOpen);
    }
  };

  if (dismissed) {
    return <ProductSwitcher placement={placement} className={className} />;
  }

  const isLogoPlacement = placement === "logo-chevron";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div className="relative inline-flex">
          <div
            className={cn(
              "absolute inset-0 -m-1 rounded-md ring-2 ring-primary ring-offset-2 ring-offset-sidebar",
              "animate-pulse"
            )}
            aria-hidden
          />
          <ProductSwitcher placement={placement} className={cn("relative z-10", className)} />
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align={isLogoPlacement ? "start" : "end"}
        sideOffset={12}
        className="w-80 p-0 rounded-xl border border-border bg-card text-card-foreground shadow-lg"
      >
        <Card className="border-0 shadow-none gap-0 bg-transparent">
          <div className="px-4 pt-4">
            <div className="py-8 flex min-h-[80px] items-center justify-center rounded-xl bg-muted">
            <img
              src={exxatPrismLogo}
              alt="Exxat Prism"
              className="h-12 w-auto object-contain"
            />
            </div>
          </div>
          <CardHeader className="px-4 pt-2 pb-0">
            <CardTitle className="text-lg font-semibold text-foreground leading-tight">Switch to Exxat Prism</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0.5 pb-4">
            <p className="text-base text-foreground leading-normal">
              Your school uses Exxat Prism to assign placements and track learning. Open Prism to view your assignments and manage activities.
            </p>
          </CardContent>
          <div className="flex gap-2 px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleOpenPrism}
              aria-label="Open Exxat Prism - opens in new tab"
            >
              Open Prism
              <FontAwesomeIcon name="arrowUpRight" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
