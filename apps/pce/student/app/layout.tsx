import type { Metadata } from 'next'
import './globals.css'
import { DevInit } from './dev-init'

export const metadata: Metadata = {
  title: 'PCE — Student Portal',
  description: 'Exxat Post Course Evaluation Student Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {process.env.NODE_ENV === 'development' && <DevInit />}
        {children}
      </body>
    </html>
  )
}
