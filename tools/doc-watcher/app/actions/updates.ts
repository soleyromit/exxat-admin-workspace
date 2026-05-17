'use server'

import { readUpdatesLog } from '@/lib/github-storage'
import type { UpdateEntry } from '@/lib/types'

export interface UpdateFilters {
  product?: string
  period?: string
  type?: string
}

function isWithinPeriod(date: string, period: string): boolean {
  const d = new Date(date)
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (period === 'month') return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return true
}

export async function getUpdates(filters: UpdateFilters = {}): Promise<UpdateEntry[]> {
  const { data } = await readUpdatesLog()
  const { product = 'all', period = 'week', type = 'all' } = filters
  return data.entries
    .filter(e => {
      if (product !== 'all' && e.product !== product) return false
      if (!isWithinPeriod(e.date, period)) return false
      if (type !== 'all' && e.type !== type) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
