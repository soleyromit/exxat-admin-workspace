import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exam Management — Admin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="theme-one" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        <script
          src="https://kit.fontawesome.com/d9bd5774e0.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
