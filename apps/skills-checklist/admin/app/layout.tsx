import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Skills Tracking — Admin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Skills Tracking is a Prism module (requirements title: "Prism — Skills Tracking Module"),
      // so it takes the DS Prism theme. Theme choice for a standalone product is OPEN with OD-P1.
      className="theme-prism"
      // Compact is the only shell the DS ships; globals.css keys radius scale and gutters off it.
      data-shell-density="compact"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        <script src="https://kit.fontawesome.com/d9bd5774e0.js" crossOrigin="anonymous" async />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
