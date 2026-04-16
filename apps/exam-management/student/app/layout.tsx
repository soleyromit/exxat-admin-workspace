import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exam Management — Student',
  description: 'Exxat Exam Management Student Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://kit.fontawesome.com/d9bd5774e0.js" crossOrigin="anonymous" async={true} />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  )
}
