import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

interface UpdatesLog {
  entries: Array<{
    id: string; date: string; product: string; type: string
    title: string; what: string; why: string; severity: string | null
    files: string[]; source: string
  }>
}

export function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 404 })
  }
  try {
    // cwd() when Next.js runs = apps/pce/admin/
    const logPath = join(process.cwd(), '..', '..', '..', '..', 'docs', 'watch', 'updates-log.json')
    const raw = readFileSync(logPath, 'utf-8')
    const log: UpdatesLog = JSON.parse(raw)
    const { searchParams } = new URL(request.url)
    const product = searchParams.get('product') ?? 'pce'
    const period = searchParams.get('period') ?? 'week'
    const type = searchParams.get('type') ?? 'all'
    const now = new Date()
    const cutoff = period === 'today' ? new Date(now.toDateString())
      : period === 'week' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : period === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(0)
    const filtered = log.entries.filter(e => {
      if (product !== 'all' && e.product !== product) return false
      if (new Date(e.date) < cutoff) return false
      if (type !== 'all' && e.type !== type) return false
      return true
    })
    return NextResponse.json(filtered)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
