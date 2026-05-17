import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Doc Watcher — Exxat' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24, fontSize: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Doc Watcher</span>
          <a href="/" style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}>Registry</a>
          <a href="/updates" style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}>Updates</a>
        </nav>
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
