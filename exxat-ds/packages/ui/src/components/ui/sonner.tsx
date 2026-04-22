"use client"

/** Shadcn Sonner wrapper — do **not** use for product `toast()` calls; see **`AGENTS.md` §6.5** and **`.cursor/rules/exxat-no-toast.mdc`**. */
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <i className="fa-light fa-circle-check size-4" aria-hidden="true" />,
        info: <i className="fa-light fa-circle-info size-4" aria-hidden="true" />,
        warning: <i className="fa-light fa-triangle-exclamation size-4" aria-hidden="true" />,
        error: <i className="fa-light fa-octagon-xmark size-4" aria-hidden="true" />,
        loading: <i className="fa-light fa-spinner size-4 animate-spin" aria-hidden="true" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
