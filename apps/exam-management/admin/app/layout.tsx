import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Exam Management — Admin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="theme-prism" suppressHydrationWarning>
      <head>
        {/* Seed brand default to "prism" before useAppTheme hydrates from localStorage.
            The DS hook falls back to "one" when no entry exists — this prevents that. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var k='exxat-brand';if(!localStorage.getItem(k)){localStorage.setItem(k,'prism');}})();` }} />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        <script
          src="https://kit.fontawesome.com/d9bd5774e0.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
