"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import exxatPrismLogo from "../../../Illustration/Exxat_Prism.svg";

const EXXAT_PRISM_URL = "https://exxat.com/products/exxat-prism";

export function GreetingPrismBadge() {
  const [open, setOpen] = React.useState(false);

  const handleOpenPrism = () => {
    setOpen(false);
    window.open(EXXAT_PRISM_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0"
          aria-label="Also on Exxat Prism – click for details"
        >
          <img
            src={exxatPrismLogo}
            alt=""
            aria-hidden
            className="h-3.5 w-auto object-contain"
          />
          <span className="text-muted-foreground">Also on</span>
          <span className="font-bold">
            <span>Exxat</span>{" "}
            <span className="text-primary">Prism</span>
          </span>
          <FontAwesomeIcon name="chevronDown" className="h-3 w-3 text-muted-foreground" weight="light" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        className="w-72 p-0 rounded-xl border border-border bg-card text-card-foreground shadow-lg"
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-center rounded-lg bg-muted py-5">
            <img
              src={exxatPrismLogo}
              alt="Exxat Prism"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-base text-foreground leading-tight">Switch to Exxat Prism</p>
            <p className="text-sm text-muted-foreground leading-normal">
              Your school uses Exxat Prism for placements and learning activities. Open Prism to view your assignments.
            </p>
          </div>
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleOpenPrism}
            aria-label="Open Exxat Prism – opens in new tab"
          >
            Open Exxat Prism
            <FontAwesomeIcon name="arrowUpRight" className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
