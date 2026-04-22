import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProductProvider } from "@/contexts/product-context"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { cn } from "@/lib/utils"

/**
 * Inter — primary brand typeface for Exxat One (Lavender) and Exxat Prism (Rose).
 * Loaded via next/font for zero layout shift and optimal subsetting.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Exxat Design System",
  description:
    "Shared UI component library for Exxat One and Exxat Prism — built to WCAG 2.1 Level AA.",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    /**
     * RTL: dir="rtl" mirrors layout for right-to-left languages.
     * lang="en" is the default; override per-page for localised content.
     *
     * WCAG notes:
     *  - suppressHydrationWarning prevents theme-flicker false positives.
     *  - Theme classes (theme-one / theme-prism / dark) are managed by
     *    ThemeProvider and applied to <html>.
     *  - "theme-one" sets Exxat One Lavender as the default brand.
     *    Replace with "theme-prism" to switch to Exxat Prism Rose.
     */
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", inter.variable)}
    >
      <head>
        {/* Default until ThemeColorSync hydrates (brand + mode override client-side) */}
        <meta name="theme-color" content="#f6f3ff" />
        {/* Adobe Fonts — preconnect + preload Ivy Presto · Kit ID: wuk5wqn */}
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="preload" href="https://use.typekit.net/wuk5wqn.css" as="style" />
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
      </head>
      <body className="bg-sidebar text-foreground font-sans">
        {/* Font Awesome Pro Kit — Kit ID: d9bd5774e0 */}
        <Script
          src="https://kit.fontawesome.com/d9bd5774e0.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProductProvider>
            <ThemeColorSync />
            <TooltipProvider delayDuration={300}>
              {/* Skip to main content — WCAG 2.4.1 (Bypass Blocks) */}
              <a href="#main-content" className="skip-to-content">
                Skip to main content
              </a>
              {children}
            </TooltipProvider>
          </ProductProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
