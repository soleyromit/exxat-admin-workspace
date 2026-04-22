import React from "react";
import { cn } from "./ui/utils";

export type FontAwesomeIconName =
  | "home"
  | "search"
  | "plus"
  | "edit"
  | "chartBar"
  | "chartLine"
  | "starChristmas"
  | "user"
  | "lock"
  | "envelope"
  | "eye"
  | "eyeSlash"
  | "circleExclamation"
  | "circleCheck"
  | "refresh"
  | "check"
  | "chevronDown"
  | "briefcase"
  | "hospital"
  | "star"
  | "chevronUp"
  | "arrowRight"
  | "copy"
  | "phone"
  | "pen"
  | "shieldCheck"
  | "circleInfo"
  | "circlesOverlap"
  | "graduationCap"
  | "school"
  | "spinner"
  | "calendarAlt"
  | "chevronLeft"
  | "chevronRight";

export const fontAwesomeIcons: Record<FontAwesomeIconName, string> = {
  home: "far fa-home",
  search: "far fa-search",
  plus: "far fa-plus",
  edit: "far fa-edit",
  chartBar: "far fa-chart-bar",
  chartLine: "far fa-chart-line",
  starChristmas: "fas fa-star-christmas",
  user: "far fa-user",
  lock: "far fa-lock",
  envelope: "far fa-envelope",
  eye: "far fa-eye",
  eyeSlash: "far fa-eye-slash",
  circleExclamation: "fas fa-circle-exclamation",
  circleCheck: "fas fa-circle-check",
  refresh: "far fa-arrows-rotate",
  check: "far fa-check",
  chevronDown: "far fa-chevron-down",
  briefcase: "far fa-briefcase",
  hospital: "far fa-hospital",
  star: "far fa-star",
  chevronUp: "far fa-chevron-up",
  arrowRight: "far fa-arrow-right",
  copy: "far fa-copy",
  phone: "far fa-phone",
  pen: "far fa-pen",
  shieldCheck: "fas fa-shield-check",
  circleInfo: "far fa-circle-info",
  circlesOverlap: "far fa-circles-overlap",
  graduationCap: "far fa-graduation-cap",
  school: "far fa-school",
  spinner: "fas fa-spinner",
  calendarAlt: "far fa-calendar-alt",
  chevronLeft: "far fa-chevron-left",
  chevronRight: "far fa-chevron-right",
};

interface FontAwesomeIconProps extends React.HTMLAttributes<HTMLElement> {
  name: FontAwesomeIconName;
  weight?: "light" | "regular" | "solid" | "duotone" | "thin";
  spin?: boolean;
  pulse?: boolean;
  className?: string;
}

export const FontAwesomeIcon = ({
  name,
  weight,
  spin,
  pulse,
  className,
  style,
  ...props
}: FontAwesomeIconProps) => {
  let iconClass = fontAwesomeIcons[name];

  if (weight) {
    const weightPrefix = {
      light: "fal",
      regular: "far",
      solid: "fas",
      duotone: "fad",
      thin: "fat",
    }[weight];
    
    // Replace the default prefix (first 3 chars) with the requested weight
    iconClass = iconClass.replace(/^[a-z]{3}/, weightPrefix);
  }

  return (
    <i
      className={cn(
        iconClass,
        spin && "fa-spin",
        pulse && "fa-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};