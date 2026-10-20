/**
 * A small dependency-free QR code generator (byte mode, error correction level M, versions 1 to 10, so up to 213 bytes). The DS has
 * no QR component and the app has no QR package, so this is the one hand-rolled piece of Stage 2 (docs/v2/new-components-needed.md).
 * It is checked by an independent decoder in tests/v2/qr.test.ts.
 */

// ---- Galois field GF(256), primitive polynomial 0x11D -------------------------------------------------------------
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

function generator(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= mul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

/** Reed-Solomon parity for one block. */
export function rsParity(data: number[], ecLen: number): number[] {
  const gen = generator(ecLen)
  const rem = new Array(ecLen).fill(0)
  for (const d of data) {
    const factor = d ^ rem[0]
    rem.shift()
    rem.push(0)
    if (factor !== 0) for (let i = 0; i < ecLen; i++) rem[i] ^= mul(gen[i + 1], factor)
  }
  return rem
}

// ---- Version tables, level M -----------------------------------------------------------------------------------------
interface Spec {
  ecPerBlock: number
  /** [blockCount, dataCodewordsPerBlock] groups. */
  groups: Array<[number, number]>
  align: number[]
}
const SPECS: Record<number, Spec> = {
  1: { ecPerBlock: 10, groups: [[1, 16]], align: [] },
  2: { ecPerBlock: 16, groups: [[1, 28]], align: [6, 18] },
  3: { ecPerBlock: 26, groups: [[1, 44]], align: [6, 22] },
  4: { ecPerBlock: 18, groups: [[2, 32]], align: [6, 26] },
  5: { ecPerBlock: 24, groups: [[2, 43]], align: [6, 30] },
  6: { ecPerBlock: 16, groups: [[4, 27]], align: [6, 34] },
  7: { ecPerBlock: 18, groups: [[4, 31]], align: [6, 22, 38] },
  8: { ecPerBlock: 22, groups: [[2, 38], [2, 39]], align: [6, 24, 42] },
  9: { ecPerBlock: 22, groups: [[3, 36], [2, 37]], align: [6, 26, 46] },
  10: { ecPerBlock: 26, groups: [[4, 43], [1, 44]], align: [6, 28, 50] },
}
const dataCapacity = (v: number) => SPECS[v].groups.reduce((n, [c, d]) => n + c * d, 0)
export const MAX_BYTES = 213

const utf8 = (text: string): number[] => Array.from(new TextEncoder().encode(text))

function bitsFor(bytes: number[], version: number): number[] {
  const bits: number[] = []
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, version <= 9 ? 8 : 16)
  for (const b of bytes) push(b, 8)
  const cap = dataCapacity(version) * 8
  push(0, Math.min(4, cap - bits.length))
  while (bits.length % 8) bits.push(0)
  for (let pad = 0xec; bits.length < cap; pad = pad === 0xec ? 0x11 : 0xec) push(pad, 8)
  return bits
}

/** Data and parity codewords, interleaved as the standard requires. */
export function codewords(bytes: number[], version: number): number[] {
  const bits = bitsFor(bytes, version)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2))
  const { ecPerBlock, groups } = SPECS[version]
  const blocks: number[][] = []
  let at = 0
  for (const [count, size] of groups) for (let i = 0; i < count; i++) (blocks.push(data.slice(at, at + size)), (at += size))
  const parity = blocks.map((b) => rsParity(b, ecPerBlock))
  const out: number[] = []
  const longest = Math.max(...blocks.map((b) => b.length))
  for (let i = 0; i < longest; i++) for (const b of blocks) if (i < b.length) out.push(b[i])
  for (let i = 0; i < ecPerBlock; i++) for (const p of parity) out.push(p[i])
  return out
}

// ---- Matrix construction -------------------------------------------------------------------------------------------------
const sizeOf = (v: number) => 17 + 4 * v

function formatBits(mask: number): number {
  const data = (0b00 << 3) | mask // level M is 00
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}

function versionBits(version: number): number {
  let rem = version
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  return (version << 12) | rem
}

interface Grid {
  size: number
  dark: boolean[][]
  fn: boolean[][]
}

function emptyGrid(version: number): Grid {
  const size = sizeOf(version)
  const dark = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const fn = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  return { size, dark, fn }
}

function setFn(g: Grid, r: number, c: number, v: boolean) {
  if (r < 0 || c < 0 || r >= g.size || c >= g.size) return
  g.dark[r][c] = v
  g.fn[r][c] = true
}

function drawFunctionPatterns(g: Grid, version: number) {
  const { size } = g
  for (let i = 0; i < size; i++) {
    setFn(g, 6, i, i % 2 === 0)
    setFn(g, i, 6, i % 2 === 0)
  }
  for (const [r, c] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const d = Math.max(Math.abs(dr - 3), Math.abs(dc - 3))
        setFn(g, r + dr, c + dc, d !== 2 && d !== 4)
      }
    }
  }
  const al = SPECS[version].align
  for (const r of al) {
    for (const c of al) {
      if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (r === al[al.length - 1] && c === 6)) continue
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) setFn(g, r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
    }
  }
  // Reserve the format areas, then the version areas.
  drawFormat(g, 0)
  if (version >= 7) {
    const v = versionBits(version)
    for (let i = 0; i < 18; i++) {
      const bit = ((v >>> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFn(g, a, b, bit)
      setFn(g, b, a, bit)
    }
  }
}

function drawFormat(g: Grid, mask: number) {
  const bits = formatBits(mask)
  const bit = (i: number) => ((bits >>> i) & 1) === 1
  const { size } = g
  for (let i = 0; i <= 5; i++) setFn(g, i, 8, bit(i))
  setFn(g, 7, 8, bit(6))
  setFn(g, 8, 8, bit(7))
  setFn(g, 8, 7, bit(8))
  for (let i = 9; i < 15; i++) setFn(g, 8, 14 - i, bit(i))
  for (let i = 0; i < 8; i++) setFn(g, 8, size - 1 - i, bit(i))
  for (let i = 8; i < 15; i++) setFn(g, size - 15 + i, 8, bit(i))
  setFn(g, size - 8, 8, true) // the fixed dark module
}

function placeData(g: Grid, words: number[]) {
  const total = words.length * 8
  let i = 0
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < g.size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? g.size - 1 - vert : vert
        if (!g.fn[y][x] && i < total) {
          g.dark[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
    }
  }
}

const MASKS: Array<(r: number, c: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function applyMask(g: Grid, mask: number) {
  for (let r = 0; r < g.size; r++) for (let c = 0; c < g.size; c++) if (!g.fn[r][c] && MASKS[mask](r, c)) g.dark[r][c] = !g.dark[r][c]
}

function penalty(g: Grid): number {
  const { size, dark } = g
  let score = 0
  const runScore = (line: boolean[]) => {
    let s = 0
    let run = 1
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) run++
      else {
        if (run >= 5) s += 3 + (run - 5)
        run = 1
      }
    }
    // finder-like 1:1:3:1:1 pattern with 4 light modules on a side
    const pat = [true, false, true, true, true, false, true]
    for (let i = 0; i + 7 <= line.length; i++) {
      if (pat.every((p, k) => line[i + k] === p)) {
        const before = i >= 4 && [1, 2, 3, 4].every((k) => !line[i - k])
        const after = i + 11 <= line.length && [7, 8, 9, 10].every((k) => !line[i + k])
        if (before || after) s += 40
      }
    }
    return s
  }
  for (let r = 0; r < size; r++) score += runScore(dark[r])
  for (let c = 0; c < size; c++) score += runScore(dark.map((row) => row[c]))
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (dark[r][c] === dark[r][c + 1] && dark[r][c] === dark[r + 1][c] && dark[r][c] === dark[r + 1][c + 1]) score += 3
  const total = size * size
  const darkCount = dark.reduce((n, row) => n + row.filter(Boolean).length, 0)
  score += Math.floor(Math.abs((darkCount * 100) / total - 50) / 5) * 10
  return score
}

export interface QrResult {
  version: number
  mask: number
  size: number
  /** true is a dark module. No quiet zone. */
  modules: boolean[][]
}

/** Smallest version that holds the text, or null when it is longer than 213 bytes. */
export function versionFor(text: string): number | null {
  const n = utf8(text).length
  for (let v = 1; v <= 10; v++) {
    // 4 mode bits, the count indicator (8 bits up to version 9, 16 after) and 8 bits per byte must fit the data bits.
    if (4 + (v <= 9 ? 8 : 16) + 8 * n <= dataCapacity(v) * 8) return v
  }
  return null
}

/** Builds the matrix. Pass `forceMask` (0 to 7) to skip the penalty search, which tests use to compare against a reference. */
export function qrEncode(text: string, forceMask?: number): QrResult {
  const bytes = utf8(text)
  const version = versionFor(text)
  if (version === null) throw new Error(`That link is longer than ${MAX_BYTES} bytes and cannot be shown as a QR code.`)
  const words = codewords(bytes, version)
  const build = (mask: number) => {
    const g = emptyGrid(version)
    drawFunctionPatterns(g, version)
    placeData(g, words)
    applyMask(g, mask)
    drawFormat(g, mask)
    return g
  }
  let best = forceMask ?? 0
  let bestGrid = build(best)
  if (forceMask === undefined) {
    let bestScore = penalty(bestGrid)
    for (let m = 1; m < 8; m++) {
      const g = build(m)
      const p = penalty(g)
      if (p < bestScore) ((bestScore = p), (best = m), (bestGrid = g))
    }
  }
  return { version, mask: best, size: bestGrid.size, modules: bestGrid.dark }
}

/** One SVG path (dark runs as rectangles) with a quiet zone of 4 modules around it. */
export function qrPath(r: QrResult, quiet = 4): { d: string; viewBox: string } {
  const parts: string[] = []
  for (let y = 0; y < r.size; y++) {
    let x = 0
    while (x < r.size) {
      if (!r.modules[y][x]) {
        x++
        continue
      }
      let w = 1
      while (x + w < r.size && r.modules[y][x + w]) w++
      parts.push(`M${x + quiet} ${y + quiet}h${w}v1h-${w}z`)
      x += w
    }
  }
  const side = r.size + quiet * 2
  return { d: parts.join(""), viewBox: `0 0 ${side} ${side}` }
}

/** Which modules are function patterns (finders, timing, alignment, format, version) for a version. Used by the tests' decoder. */
export function functionModules(version: number): boolean[][] {
  const g = emptyGrid(version)
  drawFunctionPatterns(g, version)
  return g.fn
}

export const blockLayout = (version: number) => SPECS[version]
