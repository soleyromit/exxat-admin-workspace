"use client";

import * as React from "react";
import { ExxatOneLogo } from "../brand/exxat-one-logo";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";
import { useAppStore } from "../../stores/app-store";
import exxatPrismLogo from "../../../Illustration/Exxat_Prism.svg";

const PRODUCTS = [
  { id: "exxat-one", name: "Exxat One", logo: "/Illustration/Exxat_one.svg", href: "#" },
  { id: "exxat-prism", name: "Exxat Prism", logo: exxatPrismLogo, href: "https://exxat.com/products/exxat-prism" },
] as const;

export type ProductSwitcherPlacement = "icon-next-to-help" | "logo-area" | "logo-chevron";

export function ProductSwitcher({
  placement = "icon-next-to-help",
  onProductChange,
  className,
}: {
  placement?: ProductSwitcherPlacement;
  onProductChange?: (productId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const currentProductId = useAppStore((s) => s.currentProductId);
  const setCurrentProductId = useAppStore((s) => s.setCurrentProductId);
  const isLogoArea = placement === "logo-area";
  const isLogoChevron = placement === "logo-chevron";

  const handleSelect = (productId: string) => {
    setOpen(false);
    setCurrentProductId(productId);
    onProductChange?.(productId);
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product?.href && product.href !== "#") {
      window.location.href = product.href;
    }
  };

  const renderTrigger = () => {
    if (isLogoChevron) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-1.5 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_[data-glow]]:hidden",
            className
          )}
          aria-label="Switch product"
        >
          <ExxatOneLogo className="h-7" />
          <FontAwesomeIcon name="chevronDown" className="size-3.5 shrink-0" weight="light" aria-hidden />
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 min-w-8 shrink-0 text-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_[data-glow]]:hidden",
          className
        )}
        aria-label="Switch product"
      >
        {isLogoArea ? (
          <FontAwesomeIcon name="grid2" className="size-[1.125rem] shrink-0" weight="light" aria-hidden />
        ) : (
          <FontAwesomeIcon name="grid2" className="text-lg" weight="light" />
        )}
      </Button>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            {renderTrigger()}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Switch product</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align={isLogoChevron ? "start" : "end"}
        side="bottom"
        sideOffset={8}
        className="min-w-[140px] rounded-lg z-[100] p-1.5"
      >
        {PRODUCTS.map((product) => (
          <DropdownMenuItem
            key={product.id}
            onClick={() => handleSelect(product.id)}
            className={cn(
              "gap-3 cursor-pointer flex items-center justify-start py-3 px-3",
              product.id === currentProductId && "bg-muted font-medium"
            )}
            aria-label={product.name}
          >
            <img
              src={product.logo}
              alt=""
              aria-hidden
              className="h-5 w-14 object-contain object-left shrink-0"
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
