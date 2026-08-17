import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { DevInit } from './dev-init'
import { PCE_BRAND_COLOR } from '@/lib/product-brand'

export const metadata: Metadata = {
  title: 'PCE Admin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className="theme-custom"
      // `theme-custom` derives every brand-tinted token (--sidebar,
      // --sidebar-accent, --accent, --ring, wordmark color, …) from this one
      // var — the DS's documented per-tenant override mechanism (see
      // `@exxatdesignux/ui/src/globals.css` around `.theme-custom`, comment
      // "Usage: <html class="theme-custom" style="--custom-product-brand-color: …">").
      // Matches the DS workspace's own "Exxat PCE" tenant color
      // (`localhost:4000/pce`) — was previously `theme-prism` (pink),
      // borrowed from Prism rather than PCE's actual brand.
      style={{ ['--custom-product-brand-color' as string]: PCE_BRAND_COLOR }}
      // Compact is PCE's only shell (matches the DS's own single-variant
      // `isCompactShell()` — see `lib/shell-layout.ts` Update 10 note).
      // globals.css keys the radius scale, bar surface, and flush gutters off
      // this attribute (`html[data-shell-density="compact"]`); without it
      // every rounded corner in the app renders at the non-compact default
      // instead of the tighter compact scale DS actually ships.
      data-shell-density="compact"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        <script
          src="https://kit.fontawesome.com/d9bd5774e0.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {process.env.NODE_ENV === 'development' && <DevInit />}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
