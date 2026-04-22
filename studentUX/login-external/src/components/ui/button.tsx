import * as React from "react"
import { Slot } from "@radix-ui/react-slot@1.1.2"
import { cva, type VariantProps } from "class-variance-authority@0.7.1"

import { cn } from "./utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: Exxat brand color with sophisticated hover effect
        primary: "group bg-[#3F51B5] text-white shadow-sm relative overflow-hidden transition-transform will-change-transform ease-[cubic-bezier(0.165,0.85,0.45,1)] duration-150 hover:scale-y-[1.015] hover:scale-x-[1.005] [backface-visibility:hidden] active:scale-[0.985]",
        // Secondary: Subtle background with border (matches Edit button on survey cards)
        secondary: "bg-muted/50 hover:bg-muted text-foreground border border-border/40",
        // Ghost: Transparent with hover
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Destructive: For delete/remove actions
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Link: Underlined text style
        link: "text-primary underline-offset-4 hover:underline",
        // Outline: Traditional outline style (2px border)
        outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // Small: Compact buttons for cards and tight spaces (h-7)
        sm: "h-7 px-3 text-xs rounded-lg",
        // Medium/Default: Standard buttons for most use cases (h-9)
        default: "h-9 px-4 text-sm rounded-full",
        // Large: Primary CTAs and hero buttons (h-11)
        lg: "h-11 px-6 text-base rounded-full",
        // Icon buttons
        icon: "h-9 w-9 rounded-full",
        "icon-sm": "h-7 w-7 rounded-lg",
        "icon-lg": "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // For primary variant, wrap children with hover effect
    if (variant === "primary" || (!variant && !className?.includes("variant"))) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
          <span 
            className="absolute inset-0 pointer-events-none opacity-0 transition-all duration-200 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            style={{
              background: 'radial-gradient(at bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))'
            }}
          />
        </Comp>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }