import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
  withIcon?: boolean
  iconPosition?: "left" | "right" | "only"
  interactive?: boolean
  size?: "xs" | "sm" | "md" | "lg"
  style?: "solid" | "outline" | "soft"
}

function Badge({ 
  className, 
  variant, 
  asChild, 
  withIcon, 
  iconPosition, 
  interactive,
  size,
  style,
  ...props 
}: BadgeProps) {
  // Filter out all custom props that shouldn't be passed to DOM
  // Keep only valid HTML attributes for the div element
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Count display component for simple numeric counts in sidebar
function CountText({ 
  children, 
  className, 
  ...props 
}: React.ComponentProps<"span">) {
  return (
    <span 
      className={cn(
        "text-sm text-muted-foreground font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// New badge component for "New" indicators (sidebar, data table) — blue for consistency
// Uses text-xs which scales with density via globals.css
function NewBadge({
  className,
  children = "New",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-chart-1 px-1.5 py-0.5 text-xs font-medium text-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Beta badge component for "Beta" indicators in sidebar
function BetaBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-chart-4 px-1.5 py-0.5 text-xs font-medium text-primary-foreground",
        className
      )}
      {...props}
    >
      Beta
    </span>
  );
}

// Count badge component for numeric indicators in sidebar (red style)
function CountBadge({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 rounded-md bg-destructive px-1.5 text-xs font-medium text-destructive-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, CountText, NewBadge, BetaBadge, CountBadge, badgeVariants }