import * as React from "react";
import { cn } from "../ui/utils";

const EXXAT_ONE_LOGO = "/Illustration/Exxat_one.svg";

/**
 * ExxatOneLogo — Single combined logo (E icon + "Exxat One" wordmark).
 * Replaces the previous two-part ExxatLogoMark + ExxatOneLogo setup.
 */
export function ExxatOneLogo({
  className = "h-8",
  objectPosition,
}: {
  className?: string;
  /** For compact/collapsed view: "left" shows the E icon portion */
  objectPosition?: "left" | "center";
}) {
  return (
    <div
      data-exxat-logo
      className={cn(
        "flex-none flex overflow-hidden w-fit self-center justify-start",
        className
      )}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <img
        src={EXXAT_ONE_LOGO}
        alt="Exxat One"
        className={cn(
          "block h-full w-auto object-contain",
          objectPosition === "left" && "object-left"
        )}
        style={{
          display: "block",
          height: "100%",
          width: "auto",
          objectFit: "contain",
          objectPosition: "left center",
        }}
      />
    </div>
  );
}
