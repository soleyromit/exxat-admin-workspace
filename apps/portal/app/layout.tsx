import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Exxat Workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-prism" suppressHydrationWarning>
      <head>
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
