import { describe, expect, it } from "vitest"
import { blockLayout, functionModules, qrEncode, qrPath, versionFor } from "@/lib/v2/qr"

// A small independent decoder: reads the format information, removes the mask, walks the zigzag, checks every Reed-Solomon
// block has zero syndromes (so parity matches data) and decodes the byte-mode text.
const EXP: number[] = []
const LOG: number[] = []
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
}
const gmul = (a: number, b: number) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0)

const MASKS = [
  (r: number, c: number) => (r + c) % 2 === 0,
  (r: number) => r % 2 === 0,
  (_r: number, c: number) => c % 3 === 0,
  (r: number, c: number) => (r + c) % 3 === 0,
  (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function bch15(v: number): number {
  let rem = v
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return rem
}

function decode(m: boolean[][]): { text: string; mask: number; version: number } {
  const size = m.length
  const version = (size - 17) / 4
  // Format information, first copy: read and check its BCH code.
  let bits = 0
  const order: Array<[number, number]> = [[0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]]
  order.forEach(([r, c], i) => {
    if (m[r][c]) bits |= 1 << i
  })
  const raw = bits ^ 0x5412
  expect(bch15(raw >>> 10) ^ (raw & 0x3ff)).toBe(0) // remainder matches
  expect(raw >>> 13).toBe(0) // level M
  const mask = (raw >>> 10) & 7
  const fn = functionModules(version)
  const bitsOut: number[] = []
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert
        if (!fn[y][x]) bitsOut.push(m[y][x] !== MASKS[mask](y, x) ? 1 : 0)
      }
    }
  }
  const words: number[] = []
  for (let i = 0; i + 8 <= bitsOut.length; i += 8) words.push(parseInt(bitsOut.slice(i, i + 8).join(""), 2))
  // De-interleave and check syndromes.
  const { ecPerBlock, groups } = blockLayout(version)
  const sizes = groups.flatMap(([count, n]) => new Array<number>(count).fill(n))
  const blocks: number[][] = sizes.map(() => [])
  let at = 0
  for (let i = 0; i < Math.max(...sizes); i++) sizes.forEach((n, b) => i < n && blocks[b].push(words[at++]))
  for (let i = 0; i < ecPerBlock; i++) sizes.forEach((_n, b) => blocks[b].push(words[at++]))
  for (const block of blocks) {
    for (let s = 0; s < ecPerBlock; s++) {
      let acc = 0
      for (const w of block) acc = gmul(acc, EXP[s]) ^ w
      expect(acc, "Reed-Solomon syndrome").toBe(0)
    }
  }
  const data = blocks.flatMap((b, i) => b.slice(0, sizes[i]))
  const stream = data.map((w) => w.toString(2).padStart(8, "0")).join("")
  expect(stream.slice(0, 4)).toBe("0100") // byte mode
  const cc = version <= 9 ? 8 : 16
  const len = parseInt(stream.slice(4, 4 + cc), 2)
  const bytes: number[] = []
  for (let i = 0; i < len; i++) bytes.push(parseInt(stream.slice(4 + cc + i * 8, 4 + cc + i * 8 + 8), 2))
  return { text: new TextDecoder().decode(new Uint8Array(bytes)), mask, version }
}

const SHORT = "http://localhost:3007/v2/preceptor/preceptor-evaluation?request=sub-maya-1"
const LONG = "https://skills-checklist-v2.example.com/v2/preceptor/preceptor-evaluation?request=sub-maya-12&handover=1&return=%2Fv2%2Fstudent%2Frequest-signoff"

describe("qr", () => {
  it("picks the smallest version that holds the text and refuses longer text", () => {
    expect(versionFor("hi")).toBe(1)
    expect(versionFor("x".repeat(14))).toBe(1)
    expect(versionFor("x".repeat(15))).toBe(2)
    expect(versionFor("x".repeat(213))).toBe(10)
    expect(versionFor("x".repeat(214))).toBeNull()
    expect(() => qrEncode("x".repeat(300))).toThrow(/longer than 213 bytes/)
  })

  it("draws finder, timing and the fixed dark module", () => {
    const { modules: m, size } = qrEncode(SHORT)
    for (const [r, c] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      for (let i = 0; i < 7; i++) {
        expect(m[r][c + i]).toBe(true)
        expect(m[r + 6][c + i]).toBe(true)
        expect(m[r + i][c]).toBe(true)
        expect(m[r + i][c + 6]).toBe(true)
      }
      expect(m[r + 3][c + 3]).toBe(true)
      expect(m[r + 1][c + 1]).toBe(false)
    }
    for (let i = 8; i < size - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0)
      expect(m[i][6]).toBe(i % 2 === 0)
    }
    expect(m[size - 8][8]).toBe(true)
  })

  it("decodes back to the same text with valid format information and parity (short and long link, every mask)", () => {
    for (const text of [SHORT, LONG, "é and ü", "a"]) {
      for (let mask = 0; mask < 8; mask++) {
        const q = qrEncode(text, mask)
        const d = decode(q.modules)
        expect(d.text).toBe(text)
        expect(d.mask).toBe(mask)
      }
      const auto = qrEncode(text)
      expect(decode(auto.modules).text).toBe(text)
    }
  })

  it("uses a larger version for a long link and covers version information (7 and up)", () => {
    expect(qrEncode(SHORT).version).toBeLessThan(qrEncode(LONG).version)
    const big = qrEncode("z".repeat(150))
    expect(big.version).toBeGreaterThanOrEqual(7)
    expect(decode(big.modules).text).toBe("z".repeat(150))
  })

  it("builds an SVG path with a quiet zone", () => {
    const q = qrEncode("hi")
    const p = qrPath(q)
    expect(p.viewBox).toBe(`0 0 ${q.size + 8} ${q.size + 8}`)
    expect(p.d.startsWith("M4 4h7v1h-7z")).toBe(true)
  })
})
