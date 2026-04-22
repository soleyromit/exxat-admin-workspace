import * as React from "react";

import { cn } from "./utils";

const inputVariants = {
  default:
    "bg-input-background border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  outline:
    "bg-background border text-foreground ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-input/30",
} as const;

interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  variant?: keyof typeof inputVariants;
}

function Input({ className, type, variant = "default", style, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md border px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [min-height:var(--control-height)] [height:var(--control-height)] [padding-block:var(--control-padding-y)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        inputVariants[variant],
        "border-[var(--control-border)]",
        className,
      )}
      style={{ borderColor: "var(--control-border)", ...style } as React.CSSProperties}
      {...props}
    />
  );
}

export { Input, inputVariants };