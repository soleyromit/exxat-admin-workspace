// @vitest-environment node
import { describe, expect, it } from "vitest"
import { asciiOnly, canonical, checkPdf, renderPdf, sha256Hex, signPdf, type SignedContent } from "@/lib/v2/pdf"

const CONTENT: SignedContent = {
  v: 1,
  kind: "student-report",
  generatedAt: "2026-10-20T10:15:00.000Z",
  title: "Student skills report",
  subject: "Maya Ferreira. Harbor University, BSN.",
  filters: ["Category: Assessment"],
  blocks: [
    { t: "h2", s: "Summary" },
    { t: "p", s: "Maya has 1 of 4 mandatory skills achieved. ".repeat(12) },
    { t: "mono", s: "Vital signs and early warning score          Mandatory  Achieved" },
    { t: "rule" },
  ],
}

const text = (b: Uint8Array) => new TextDecoder("latin1").decode(b)
const bytes = (t: string) => Uint8Array.from(t, (c) => c.charCodeAt(0) & 0xff)

describe("sha256 and canonical form", () => {
  it("matches the published SHA-256 of abc", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  })
  it("sorts keys so the same content gives the same text", () => {
    expect(canonical({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}')
  })
})

describe("the PDF itself", () => {
  it("is a real PDF with an xref table, a trailer and one text page at least", async () => {
    const signed = await signPdf(CONTENT)
    const t = text(signed.bytes)
    expect(t.startsWith("%PDF-1.4")).toBe(true)
    expect(t).toContain("%%EOF")
    expect(t).toContain("/Type /Pages")
    expect(t).toContain("(Student skills report)")
    expect(signed.pages).toBeGreaterThanOrEqual(1)
    // The xref offset really points at the xref keyword.
    const start = Number(/startxref\n(\d+)\n/.exec(t)![1])
    expect(t.slice(start, start + 4)).toBe("xref")
  })

  it("is deterministic: the same content makes the same bytes", async () => {
    const a = await signPdf(CONTENT)
    const b = await signPdf(CONTENT)
    expect(a.fileHash).toBe(b.fileHash)
    expect(a.hash).toBe(b.hash)
  })

  it("prints the hash and signature in the document as text", async () => {
    const signed = await signPdf(CONTENT)
    const t = text(signed.bytes)
    expect(t).toContain(signed.hash.slice(0, 32))
    expect(t).toContain(signed.signature.slice(0, 32))
    expect(t).toContain("What the signature proves")
  })

  it("puts each line of a multi-line block on its own line, with no stray marks", async () => {
    const t = text((await signPdf(CONTENT)).bytes)
    expect(t).toContain("(Content hash \\(SHA-256\\)) Tj ET")
    expect(t).not.toContain("SHA-256\\)?")
    expect(asciiOnly("a\nb")).toBe("a\nb")
  })

  it("starts a new page when the content is long", async () => {
    const long: SignedContent = { ...CONTENT, blocks: Array.from({ length: 120 }, (_, i) => ({ t: "mono" as const, s: `Row ${i}` })) }
    expect((await signPdf(long)).pages).toBeGreaterThan(1)
  })

  it("keeps names with accents and quotes readable and never breaks the string syntax", () => {
    expect(asciiOnly("Zoë “Ray” (x)")).toBe('Zoe "Ray" (x)')
    const out = text(renderPdf({ ...CONTENT, subject: "Back\\slash (paren) café" }, "0".repeat(64), "1".repeat(64)))
    expect(out).toContain("Back\\\\slash \\(paren\\) cafe")
  })
})

describe("checking a file", () => {
  it("passes an untouched file and returns what was signed", async () => {
    const signed = await signPdf(CONTENT)
    const r = await checkPdf(signed.bytes)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.hash).toBe(signed.hash)
      expect(r.content.subject).toBe("Maya Ferreira. Harbor University, BSN.")
    }
  })

  it("fails when the visible text is changed by one letter", async () => {
    const signed = await signPdf(CONTENT)
    const t = text(signed.bytes).replace("(Maya Ferreira. Harbor University, BSN.)", "(Maya Ferreirb. Harbor University, BSN.)")
    expect(t).not.toBe(text(signed.bytes))
    const r = await checkPdf(bytes(t))
    expect(r).toMatchObject({ ok: false, reason: "content-changed" })
  })

  it("fails when a claim in the visible text is rewritten, even at the same length", async () => {
    const signed = await signPdf(CONTENT)
    const t = text(signed.bytes).replace("1 of 4 mandatory", "4 of 4 mandatory")
    const r = await checkPdf(bytes(t))
    expect(r.ok).toBe(false)
  })

  it("fails when the embedded content is changed", async () => {
    const signed = await signPdf(CONTENT)
    const t = text(signed.bytes)
    const tampered = { ...CONTENT, subject: "Someone Else. Harbor University, BSN." }
    const b64 = btoa(canonical(tampered))
    const swapped = t.replace(/%SC-SIGNED-CONTENT [^\n]+/, `%SC-SIGNED-CONTENT ${b64}`)
    expect(await checkPdf(bytes(swapped))).toMatchObject({ ok: false, reason: "hash-mismatch" })
  })

  it("fails when the hash is changed to match changed content, because the signature no longer matches", async () => {
    const signed = await signPdf(CONTENT)
    const tampered = { ...CONTENT, subject: "Someone Else. Harbor University, BSN." }
    const json = canonical(tampered)
    const newHash = await sha256Hex(json)
    const t = text(signed.bytes).replace(/%SC-SIGNED-CONTENT [^\n]+/, `%SC-SIGNED-CONTENT ${btoa(json)}`).replace(/%SC-HASH [0-9a-f]+/, `%SC-HASH ${newHash}`)
    expect(await checkPdf(bytes(t))).toMatchObject({ ok: false, reason: "signature-invalid" })
  })

  it("fails when the signature is changed", async () => {
    const signed = await signPdf(CONTENT)
    const flipped = signed.signature.slice(0, -1) + (signed.signature.endsWith("0") ? "1" : "0")
    const t = text(signed.bytes).replace(/%SC-SIGNATURE [0-9a-f]+/, `%SC-SIGNATURE ${flipped}`)
    expect(await checkPdf(bytes(t))).toMatchObject({ ok: false, reason: "signature-invalid" })
  })

  it("says plainly when a PDF is not from this prototype, or is not a PDF", async () => {
    const signed = await signPdf(CONTENT)
    const body = text(signed.bytes).split("\n%SC-SIGNED-CONTENT")[0] + "\n"
    expect(await checkPdf(bytes(body))).toMatchObject({ ok: false, reason: "not-signed" })
    expect(await checkPdf(bytes("hello"))).toMatchObject({ ok: false, reason: "unreadable" })
    const broken = text(signed.bytes).replace(/%SC-SIGNED-CONTENT [^\n]+/, "%SC-SIGNED-CONTENT ###")
    expect((await checkPdf(bytes(broken))).ok).toBe(false)
  })
})
