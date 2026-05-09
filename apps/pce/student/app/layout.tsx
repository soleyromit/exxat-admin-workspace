import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PCE — Student Portal',
  description: 'Exxat Post Course Evaluation Student Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {/* A11Y-012 — skip-to-main link required in student layouts */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)]"
        >
          Skip to main content
        </a>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  )
}
