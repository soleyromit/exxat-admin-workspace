"use client";

import * as React from "react";
import { cn } from "../ui/utils";
import { Card, CardContent } from "../ui/card";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import exxatPrismLogo from "../../../Illustration/Exxat_Prism.svg";

const EXXAT_PRISM_URL = "https://exxat.com/products/exxat-prism";

export function HomeExxatPrismBanner({ variant = "default" }: { variant?: "default" | "concise" | "top" }) {
  const isConcise = variant === "concise";
  const isTop = variant === "top";

  if (isTop) {
    return (
      <div
        className="w-full h-8 flex items-center justify-center gap-3 px-4 shrink-0"
        style={{ backgroundColor: "var(--banner-prism-bg)" }}
      >
        <img
          src={exxatPrismLogo}
          alt="Exxat Prism"
          className="h-5 w-auto shrink-0 object-contain"
        />
        <span className="text-sm font-normal text-foreground truncate">
          View assignments in Exxat Prism
        </span>
        <a
          href={EXXAT_PRISM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary shrink-0"
        >
          Open
          <FontAwesomeIcon name="arrowUpRight" className="h-3 w-3 shrink-0" aria-hidden />
        </a>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "rounded-xl border border-border shrink-0",
        isConcise && "w-full sm:w-auto sm:max-w-fit"
      )}
      style={{ backgroundColor: "var(--banner-prism-bg)" }}
    >
      <CardContent
        className={cn(
          "flex gap-3 p-4 [&:last-child]:pb-4",
          isConcise
            ? "flex-col items-start sm:flex-row sm:items-center"
            : "flex-col sm:flex-row sm:items-center gap-4"
        )}
      >
        <img
          src={exxatPrismLogo}
          alt="Exxat Prism"
          className={cn("shrink-0 object-contain", isConcise ? "h-6 w-auto" : "h-8 w-auto")}
        />
        <div className={cn("min-w-0", !isConcise && "flex-1")}>
          <p className="text-sm font-normal text-foreground">
            {isConcise
              ? "View assignments in Exxat Prism."
              : "Your school uses Exxat Prism to assign placements and track learning. Open Exxat Prism to view your assignments and manage activities."}
          </p>
        </div>
        <a
          href={EXXAT_PRISM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary shrink-0"
        >
          Open Exxat Prism
          <FontAwesomeIcon name="arrowUpRight" className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </a>
      </CardContent>
    </Card>
  );
}
