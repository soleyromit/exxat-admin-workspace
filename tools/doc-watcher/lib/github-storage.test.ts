import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Set required env vars before importing the module
process.env.GITHUB_OWNER = 'soleyromit'
process.env.GITHUB_REPO = 'Work'
process.env.GITHUB_PAT = 'ghp_test_token'
process.env.GITHUB_BRANCH = 'main'

import {
  readRegistry,
  writeRegistry,
  readUpdatesLog,
  appendUpdate,
  readViolationInventory,
} from './github-storage'
import type { Registry, UpdateEntry, UpdatesLog } from './types'

const makeGetResponse = (data: unknown, sha = 'abc123') => ({
  ok: true,
  json: async () => ({
    content: Buffer.from(JSON.stringify(data)).toString('base64'),
    sha,
  }),
})

const makePutResponse = () => ({
  ok: true,
  json: async () => ({ commit: { sha: 'new-sha' } }),
})

beforeEach(() => {
  mockFetch.mockReset()
})

describe('readRegistry', () => {
  it('fetches registry.json and returns parsed registry with sha', async () => {
    const registry: Registry = { entries: [] }
    mockFetch.mockResolvedValueOnce(makeGetResponse(registry, 'sha-1'))

    const result = await readRegistry()

    expect(result.data).toEqual(registry)
    expect(result.sha).toBe('sha-1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('docs/watch/registry.json'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer ghp_test_token' }) })
    )
  })

  it('throws when GitHub returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(readRegistry()).rejects.toThrow('GitHub GET docs/watch/registry.json failed: 404')
  })
})

describe('writeRegistry', () => {
  it('PUTs updated registry with correct sha and commit message', async () => {
    const registry: Registry = { entries: [] }
    mockFetch.mockResolvedValueOnce(makePutResponse())

    await writeRegistry(registry, 'sha-existing', 'chore(watch): test write')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('docs/watch/registry.json')
    expect(options.method).toBe('PUT')
    const body = JSON.parse(options.body)
    expect(body.sha).toBe('sha-existing')
    expect(body.message).toBe('chore(watch): test write')
    expect(Buffer.from(body.content, 'base64').toString()).toEqual(JSON.stringify(registry, null, 2))
  })
})

describe('appendUpdate', () => {
  it('reads current log, appends entry, writes back', async () => {
    const existing: UpdatesLog = { entries: [] }
    const entry: UpdateEntry = {
      id: '2026-05-19-pce-001',
      date: '2026-05-19',
      product: 'pce',
      type: 'prd-change',
      title: 'Test entry',
      what: 'Something changed',
      why: 'PRD updated',
      source: 'PCE PRD — Monil',
      severity: null,
      files: ['apps/pce/admin/app/(app)/surveys/page.tsx'],
    }

    mockFetch.mockResolvedValueOnce(makeGetResponse(existing, 'sha-log'))
    mockFetch.mockResolvedValueOnce(makePutResponse())

    await appendUpdate(entry)

    const putCall = mockFetch.mock.calls[1]
    const body = JSON.parse(putCall[1].body)
    const written: UpdatesLog = JSON.parse(Buffer.from(body.content, 'base64').toString())
    expect(written.entries).toHaveLength(1)
    expect(written.entries[0]).toEqual(entry)
  })
})
