/**
 * Stage 5: a small PDF writer, a content hash and a tamper-evident signature. No library, no network.
 *
 * What the signature proves: the file is exactly what this page produced from the signed content. Any change to the visible text,
 * the embedded content, the hash or the signature is detected when the file is checked. It does NOT prove who produced the file: the
 * prototype signs with a demo key that ships with the page, so anyone can recompute it. A deployment signs with the program's
 * private key and checks it with the matching public key. This is a prototype of the experience, not a security control.
 */

export type BlockKind = "h1" | "h2" | "p" | "mono" | "gap" | "rule"
export interface Block {
  t: BlockKind
  s?: string
}

export type DocKind = "student-report" | "cohort-report" | "verified-record"

/** Everything the signature covers. The file is rebuilt from this, so it is also everything the file can say. */
export interface SignedContent {
  v: 1
  kind: DocKind
  /** ISO time the document was made. */
  generatedAt: string
  title: string
  subject: string
  /** The filters that produced the report, or an empty list (RP-10). */
  filters: string[]
  blocks: Block[]
}

export const DEMO_KEY = "skills-checklist-v2-demo-key-not-a-secret"

// ---------------------------------------------------------------------------------------------------------------------
// Hash and signature

const te = new TextEncoder()

function bytesToHex(b: ArrayBuffer): string {
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("")
}

export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? te.encode(data) : data
  return bytesToHex(await crypto.subtle.digest("SHA-256", bytes as BufferSource))
}

async function hmacHex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", te.encode(key) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return bytesToHex(await crypto.subtle.sign("HMAC", k, te.encode(message) as BufferSource))
}

/** JSON with sorted keys, so the same content always gives the same bytes. */
export function canonical(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(canonical).join(",")}]`
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`
  }
  return JSON.stringify(x)
}

const signatureOf = (hash: string) => hmacHex(DEMO_KEY, `sc-v2|${hash}`)

// ---------------------------------------------------------------------------------------------------------------------
// PDF writer (A4, Courier body, Helvetica Bold headings, ASCII text)

const W = 595
const H = 842
const M = 48
const BODY = 9
const LEAD = 12
const CHARS = Math.floor((W - 2 * M) / (BODY * 0.6))

const PDF_ASCII: Record<string, string> = { "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u2013": "-", "\u00a0": " ", "\u2026": "..." }

/** Courier and Helvetica in a basic PDF carry ASCII safely. Anything else is shown as its closest letter or a question mark. */
export function asciiOnly(t: string): string {
  return t
    .replace(/[\u2018\u2019\u201c\u201d\u2013\u00a0\u2026]/g, (c) => PDF_ASCII[c] ?? "?")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e\n]/g, "?")
}

const esc = (t: string) => asciiOnly(t).replace(/([\\()])/g, "\\$1")

function wrap(text: string, width: number): string[] {
  const out: string[] = []
  for (const para of asciiOnly(text).split("\n")) {
    let line = ""
    for (const word of para.split(" ")) {
      let w = word
      while (w.length > width) {
        if (line) {
          out.push(line)
          line = ""
        }
        out.push(w.slice(0, width))
        w = w.slice(width)
      }
      if (!line) line = w
      else if (line.length + 1 + w.length <= width) line += ` ${w}`
      else {
        out.push(line)
        line = w
      }
    }
    out.push(line)
  }
  return out
}

interface Line {
  font: "F1" | "F2"
  size: number
  text: string
  rule?: boolean
  gap?: number
}

function layout(blocks: Block[]): Line[][] {
  const pages: Line[][] = [[]]
  let y = H - M
  const put = (l: Line, height: number) => {
    if (y - height < M + 40) {
      pages.push([])
      y = H - M
    }
    pages[pages.length - 1].push({ ...l, gap: y })
    y -= height
  }
  for (const b of blocks) {
    if (b.t === "gap") y -= 6
    else if (b.t === "rule") put({ font: "F1", size: BODY, text: "", rule: true }, 10)
    else if (b.t === "h1") for (const t of wrap(b.s ?? "", 44)) put({ font: "F2", size: 16, text: t }, 22)
    else if (b.t === "h2") {
      y -= 4
      for (const t of wrap(b.s ?? "", 60)) put({ font: "F2", size: 11, text: t }, 16)
    } else if (b.t === "mono") for (const t of asciiOnly(b.s ?? "").split("\n")) put({ font: "F1", size: BODY, text: t.slice(0, CHARS) }, LEAD)
    else for (const t of wrap(b.s ?? "", CHARS)) put({ font: "F1", size: BODY, text: t }, LEAD)
  }
  return pages
}

const pad = (n: number, w: number) => String(n).padStart(w, "0")

/** The visible signature block. It carries the hash and the signature as text so a reader can compare them to what the page reports. */
export function signatureBlocks(hash: string, signature: string): Block[] {
  return [
    { t: "gap" },
    { t: "rule" },
    { t: "h2", s: "Signature block" },
    { t: "p", s: "What the signature proves: this file has not changed since it was signed here. It does not prove who made it. This is a prototype: it signs with a demo key that ships with the page, so anyone can recompute it. A real deployment signs with the program's private key." },
    { t: "mono", s: `Content hash (SHA-256)\n${hash.slice(0, 32)}\n${hash.slice(32)}` },
    { t: "mono", s: `Signature (HMAC-SHA-256, demo key)\n${signature.slice(0, 32)}\n${signature.slice(32)}` },
    { t: "p", s: "To check this file, choose it in Check a PDF on the Reports page." },
  ]
}

/** Deterministic: the same content, hash and signature always give the same bytes. */
export function renderPdf(c: SignedContent, hash: string, signature: string): Uint8Array {
  const header: Block[] = [
    { t: "h1", s: c.title },
    { t: "p", s: c.subject },
    { t: "p", s: `Made ${c.generatedAt.slice(0, 10)} at ${c.generatedAt.slice(11, 16)} UTC. Prototype document built from sample data.` },
    ...(c.filters.length ? ([{ t: "p", s: `Filters applied: ${c.filters.join("; ")}` }] as Block[]) : ([{ t: "p", s: "Filters applied: none" }] as Block[])),
    { t: "rule" },
  ]
  const pages = layout([...header, ...c.blocks, ...signatureBlocks(hash, signature)])
  const objs: string[] = []
  const add = (body: string) => objs.push(body)
  add("<< /Type /Catalog /Pages 2 0 R >>")
  const kids = pages.map((_, i) => `${6 + i * 2} 0 R`).join(" ")
  add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>")
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  const d = new Date(c.generatedAt)
  const stamp = Number.isNaN(d.getTime()) ? "" : `D:${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1, 2)}${pad(d.getUTCDate(), 2)}${pad(d.getUTCHours(), 2)}${pad(d.getUTCMinutes(), 2)}${pad(d.getUTCSeconds(), 2)}Z`
  add(`<< /Title (${esc(c.title)}) /Subject (${esc(`Content hash ${hash}`)}) /Producer (Skills Checklist v2 prototype) /CreationDate (${stamp}) >>`)
  pages.forEach((lines, i) => {
    const total = pages.length
    const ops = lines
      .map((l) => (l.rule ? `0.6 w ${M} ${l.gap! - 4} m ${W - M} ${l.gap! - 4} l S` : `BT /${l.font} ${l.size} Tf ${M} ${l.gap! - l.size} Td (${esc(l.text)}) Tj ET`))
      .concat(`BT /F1 8 Tf ${M} ${M - 20} Td (${esc(`${c.title}. Page ${i + 1} of ${total}. Hash ${hash.slice(0, 16)}`)}) Tj ET`)
      .join("\n")
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + i * 2} 0 R >>`)
    add(`<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`)
  })
  let out = "%PDF-1.4\n"
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${pad(o, 10)} 00000 n \n`).join("")}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return bytes
}

// ---------------------------------------------------------------------------------------------------------------------
// Sign and check

const MARK_PAYLOAD = "%SC-SIGNED-CONTENT "
const MARK_HASH = "%SC-HASH "
const MARK_SIG = "%SC-SIGNATURE "

function toBase64(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
function fromBase64(t: string): Uint8Array {
  const s = atob(t)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

export interface SignedPdf {
  bytes: Uint8Array
  /** SHA-256 of the signed content. */
  hash: string
  signature: string
  /** SHA-256 of the whole file as downloaded. */
  fileHash: string
  pages: number
}

export async function signPdf(c: SignedContent): Promise<SignedPdf> {
  const json = canonical(c)
  const hash = await sha256Hex(json)
  const signature = await signatureOf(hash)
  const body = renderPdf(c, hash, signature)
  const trailer = te.encode(`${MARK_PAYLOAD}${toBase64(te.encode(json))}\n${MARK_HASH}${hash}\n${MARK_SIG}${signature}\n`)
  const bytes = new Uint8Array(body.length + trailer.length)
  bytes.set(body, 0)
  bytes.set(trailer, body.length)
  const pages = (new TextDecoder("latin1").decode(body).match(/\/Type \/Page /g) ?? []).length
  return { bytes, hash, signature, fileHash: await sha256Hex(bytes), pages }
}

export type CheckReason = "not-signed" | "unreadable" | "content-changed" | "hash-mismatch" | "signature-invalid"

export type CheckResult =
  | { ok: true; hash: string; signature: string; content: SignedContent }
  | { ok: false; reason: CheckReason; message: string }

const FAIL: Record<CheckReason, string> = {
  "not-signed": "This file does not carry a signature from this prototype, so it cannot be checked.",
  unreadable: "This file could not be read as a signed document from this prototype.",
  "content-changed": "The text of this file does not match what was signed. It has been changed since it was made.",
  "hash-mismatch": "The signed content does not match its hash. It has been changed since it was made.",
  "signature-invalid": "The signature does not match. The hash or the signature has been changed since the file was made.",
}
const fail = (reason: CheckReason): CheckResult => ({ ok: false, reason, message: FAIL[reason] })

/** Rebuilds the file from its embedded content and compares every byte, then checks the hash and the signature. */
export async function checkPdf(file: Uint8Array): Promise<CheckResult> {
  const text = new TextDecoder("latin1").decode(file)
  const at = text.lastIndexOf(`\n${MARK_PAYLOAD}`)
  if (!text.startsWith("%PDF-") || at < 0) return fail(text.startsWith("%PDF-") ? "not-signed" : "unreadable")
  const trailer = text.slice(at + 1).split("\n")
  const b64 = trailer[0]?.slice(MARK_PAYLOAD.length)
  const hash = trailer[1]?.startsWith(MARK_HASH) ? trailer[1].slice(MARK_HASH.length) : ""
  const sig = trailer[2]?.startsWith(MARK_SIG) ? trailer[2].slice(MARK_SIG.length) : ""
  if (!b64 || !hash || !sig) return fail("unreadable")
  let content: SignedContent
  let json: string
  try {
    json = new TextDecoder().decode(fromBase64(b64))
    content = JSON.parse(json) as SignedContent
  } catch {
    return fail("unreadable")
  }
  if (!content || content.v !== 1 || !Array.isArray(content.blocks)) return fail("unreadable")
  if ((await sha256Hex(canonical(content))) !== hash) return fail("hash-mismatch")
  if ((await signatureOf(hash)) !== sig) return fail("signature-invalid")
  const rebuilt = renderPdf(content, hash, sig)
  const body = file.subarray(0, at + 1)
  if (rebuilt.length !== body.length || rebuilt.some((b, i) => b !== body[i])) return fail("content-changed")
  return { ok: true, hash, signature: sig, content }
}
