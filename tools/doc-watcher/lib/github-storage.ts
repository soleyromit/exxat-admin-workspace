import type {
  Registry,
  UpdateEntry,
  UpdatesLog,
  ViolationInventory,
  StorageFile,
} from './types'

function getConfig() {
  const OWNER = process.env.GITHUB_OWNER!
  const REPO = process.env.GITHUB_REPO!
  const PAT = process.env.GITHUB_PAT!
  const BRANCH = process.env.GITHUB_BRANCH ?? 'main'
  const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`
  const HEADERS = {
    Authorization: `Bearer ${PAT}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  return { OWNER, REPO, PAT, BRANCH, BASE, HEADERS }
}

async function getFile(path: string): Promise<StorageFile<string>> {
  const { BASE, BRANCH, HEADERS } = getConfig()
  const res = await fetch(`${BASE}/${path}?ref=${BRANCH}`, {
    headers: HEADERS,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`)
  const data = await res.json()
  return {
    data: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  }
}

async function putFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  const { BASE, BRANCH, HEADERS } = getConfig()
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PUT',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: BRANCH as string,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`GitHub PUT ${path} failed: ${res.status} — ${JSON.stringify(err)}`)
  }
}

export async function readRegistry(): Promise<StorageFile<Registry>> {
  const file = await getFile('docs/watch/registry.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function writeRegistry(
  registry: Registry,
  sha: string,
  message: string
): Promise<void> {
  await putFile('docs/watch/registry.json', JSON.stringify(registry, null, 2), sha, message)
}

export async function readUpdatesLog(): Promise<StorageFile<UpdatesLog>> {
  const file = await getFile('docs/watch/updates-log.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function appendUpdate(entry: UpdateEntry): Promise<void> {
  const current = await readUpdatesLog()
  current.data.entries.push(entry)
  await putFile(
    'docs/watch/updates-log.json',
    JSON.stringify(current.data, null, 2),
    current.sha,
    `chore(updates): ${entry.type} — ${entry.title.slice(0, 60)}`
  )
}

export async function readViolationInventory(): Promise<StorageFile<ViolationInventory>> {
  const file = await getFile('docs/watch/violation-inventory.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function writeViolationInventory(
  inventory: ViolationInventory,
  sha: string
): Promise<void> {
  await putFile(
    'docs/watch/violation-inventory.json',
    JSON.stringify(inventory, null, 2),
    sha,
    'chore(compliance): update violation inventory'
  )
}

export async function appendFlag(
  flagsPath: string,
  content: string,
  sha: string
): Promise<void> {
  await putFile(flagsPath, content, sha, `chore(flags): append to ${flagsPath}`)
}

export async function readFile(path: string): Promise<StorageFile<string>> {
  return getFile(path)
}

export async function writeFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  return putFile(path, content, sha, message)
}
