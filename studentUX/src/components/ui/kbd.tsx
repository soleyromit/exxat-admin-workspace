import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const kbdVariants = cva(
  "inline-flex items-center justify-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono font-medium text-muted-foreground shadow-[0_1px_0_1px] shadow-border/50",
  {
    variants: {
      size: {
        sm: "h-5 min-w-5 text-xs",
        default: "h-6 min-w-6 text-xs",
        lg: "h-7 min-w-7 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  /**
   * Optional keyboard shortcut key combination (e.g. "⌘K", "Ctrl+S")
   * When provided, renders each character as a separate kbd element
   */
  keys?: string[]
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, size, keys, children, ...props }, ref) => {
    if (keys && keys.length > 0) {
      return (
        <span className="inline-flex items-center gap-0.5" role="group" aria-label={`Keyboard shortcut: ${keys.join(" ")}`}>
          {keys.map((key, i) => (
            <kbd
              key={i}
              ref={i === 0 ? ref : undefined}
              className={cn(kbdVariants({ size }), className)}
              {...props}
            >
              {key}
            </kbd>
          ))}
        </span>
      )
    }

    return (
      <kbd
        ref={ref}
        className={cn(kbdVariants({ size }), className)}
        {...props}
      >
        {children}
      </kbd>
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd, kbdVariants }
