import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/* Consistent focus: ring-2 + ring-offset-2 for WCAG 2.4.11 visibility across all variants */
const buttonFocusBase = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none ${buttonFocusBase} focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group box-border touch-manipulation`,
  {
    variants: {
      variant: {
        /* Primary: light ring on dark bg — use primary-foreground for visibility */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary-foreground/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 focus-visible:ring-offset-background",
        outline:
          "border bg-background text-foreground hover:bg-muted hover:text-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:ring-ring",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:ring-ring",
        link:
          "text-primary underline underline-offset-4 hover:underline focus-visible:ring-ring focus-visible:underline",
      },
      size: {
        default: "rounded-lg px-4 py-2 has-[>svg]:px-3 min-h-10 [min-height:var(--control-height)] [padding-block:var(--control-padding-y)]",
        sm: "rounded-sm gap-1.5 px-3 py-1.5 has-[>svg]:px-2.5 min-h-11 md:min-h-8 [padding-block:6px]",
        lg: "rounded-xl px-6 py-2.5 has-[>svg]:px-4 min-h-11 [padding-block:10px]",
        icon: "rounded-sm p-2 size-11 md:size-10 min-h-11 min-w-11 md:min-h-0 md:min-w-0",
        touch: "rounded-lg gap-1.5 px-4 py-3 min-h-11 min-w-11",
        "icon-touch": "rounded-lg p-2 min-h-11 min-w-11 size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Keep outline buttons aligned with the lighter form/control border token
    const buttonStyle = variant === "outline" 
      ? { borderColor: "var(--control-border)", ...style }
      : style;

    const glowBackground =
      variant === "outline"
        ? "var(--button-glow-outline)"
        : "var(--button-glow-default)";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        style={buttonStyle}
        ref={ref}
        {...props}
      >
        <span
          data-glow
          className="absolute inset-0 -z-10 pointer-events-none opacity-0 transition-all duration-200 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 ml-[0px] mr-[4px] my-[0px]"
          style={{
            background: glowBackground,
          }}
        />
        <span
          className={cn(
            "relative z-10 inline-flex items-center justify-center",
            size === "sm" ? "gap-1.5" : "gap-2"
          )}
        >
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };