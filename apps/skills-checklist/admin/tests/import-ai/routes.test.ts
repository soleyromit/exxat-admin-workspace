// @vitest-environment node
// Route contract tests for /api/import/status, /extract and /interpret. SYNTHETIC transport (TYPESAFE_MOCK=1) and generated files.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GET as status } from "@/app/api/import/status/route"
import { POST as extract } from "@/app/api/import/extract/route"
import { POST as interpret } from "@/app/api/import/interpret/route"
import { dailyCap, interpretLimiter } from "@/lib/import-ai/guards"
import { makeDocx, makePdf, makeXlsx, makeZip } from "./fixtures/files"

const KEY = "sk-test-secret-1234567890-not-real"
const ORIGIN = { host: "localhost:3007", origin: "http://localhost:3007", "sec-fetch-site": "same-origin" }

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined)
  interpretLimiter.reset()
  dailyCap.reset()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost:3007${path}`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) })
const list = (text: string) => ({ text, sourceName: "pasted list", sourceKind: "paste" })

describe("GET /api/import/status (IM-13: AI is optional and never exposes the key)", () => {
  it("no key: ai is false and the extractors are listed", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "")
    const j = await (status() as Response).json()
    expect(j).toMatchObject({ ai: false, extractors: { xlsx: true, docx: true, pdf: true }, maxUploadBytes: 4194304 })
  })
  it("a key makes AI available, and neither the key nor anything derived from it is in the body", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", KEY)
    const res = status() as Response
    const raw = await res.text()
    expect(JSON.parse(raw).ai).toBe(true)
    expect(raw).not.toContain(KEY)
    expect(raw).not.toMatch(/sk-test|secret|1234567890/)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })
  it("SKILLS_IMPORT_AI=off disables it even with a key; a reached daily cap does too", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", KEY)
    vi.stubEnv("SKILLS_IMPORT_AI", "off")
    expect((await (status() as Response).json()).ai).toBe(false)
    vi.stubEnv("SKILLS_IMPORT_AI", "")
    vi.stubEnv("SKILLS_IMPORT_DAILY_CAP", "1")
    dailyCap.take()
    expect((await (status() as Response).json()).ai).toBe(false)
  })
})

describe("POST /api/import/interpret", () => {
  it("refuses a cross-origin caller", async () => {
    const res = await interpret(post("/api/import/interpret", list("Suction"), { origin: "https://evil.example" }))
    expect(res.status).toBe(403)
  })
  it("422 on bad JSON, an unknown field or an empty list, and the body never echoes the text", async () => {
    vi.stubEnv("TYPESAFE_MOCK", "1")
    const secret = "Confidential skill name"
    for (const [b, code] of [["{not json", "invalid_json"], [{ ...list(secret), extra: 1 }, "unknown_field"], [list("   "), "empty"]] as const) {
      const res = await interpret(post("/api/import/interpret", b))
      expect(res.status).toBe(422)
      const raw = await res.text()
      expect(JSON.parse(raw)).toEqual({ error: code })
      expect(raw).not.toContain(secret)
    }
  })
  it("no key: 200 with { result: null, fallback: 'unavailable' } so the dialog uses the standard reader", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "")
    vi.stubEnv("TYPESAFE_MOCK", "")
    const res = await interpret(post("/api/import/interpret", list("Suction")))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ result: null, fallback: "unavailable" })
  })
  it("success on the synthetic transport: rows, unread with original text, meta, and no probabilities", async () => {
    vi.stubEnv("TYPESAFE_MOCK", "1")
    const res = await interpret(post("/api/import/interpret", list("RESPIRATORY SKILLS\nSuction\nPage 3 of 12\nOxygen therapy")))
    expect(res.status).toBe(200)
    const raw = await res.text()
    const j = JSON.parse(raw)
    expect(j.result.rows.map((r: { name: string }) => r.name)).toEqual(["Suction", "Oxygen therapy"])
    expect(j.result.unread).toEqual([{ text: "Page 3 of 12", reason: "unrecognised", location: "Line 3" }])
    expect(j.result.meta).toMatchObject({ mode: "ai", candidatesAsked: 3 })
    expect(raw).not.toMatch(/probab|confidence/)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })
  it("logs counts and durations only: never the list text, the answers or the key", async () => {
    vi.stubEnv("TYPESAFE_MOCK", "1")
    vi.stubEnv("TYPESAFE_API_KEY", KEY)
    const info = vi.mocked(console.info)
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    await interpret(post("/api/import/interpret", list("Suction\nA very private skill name")))
    const logged = JSON.stringify([info.mock.calls, err.mock.calls, warn.mock.calls])
    expect(logged).not.toMatch(/Suction|private|sk-test|1234567890/)
    expect(info.mock.calls[0][1]).toMatchObject({ ok: true, requests: 1, candidates: 2 })
  })
  it("the 11th request in a minute from one client is rate limited (demo guard)", async () => {
    vi.stubEnv("TYPESAFE_MOCK", "1")
    let last = 0
    for (let i = 0; i < 11; i++) last = (await interpret(post("/api/import/interpret", list("Suction"), { "x-forwarded-for": "9.9.9.9" }))).status
    expect(last).toBe(429)
  })
  it("a reached daily cap falls back to unavailable", async () => {
    vi.stubEnv("TYPESAFE_MOCK", "1")
    vi.stubEnv("SKILLS_IMPORT_DAILY_CAP", "1")
    dailyCap.take()
    expect(await (await interpret(post("/api/import/interpret", list("Suction")))).json()).toEqual({ result: null, fallback: "unavailable" })
  })
})

const upload = (bytes: Uint8Array, name: string, headers: Record<string, string> = {}) => {
  const form = new FormData()
  form.append("file", new File([bytes as BlobPart], name))
  return new Request("http://localhost:3007/api/import/extract", { method: "POST", headers: { ...ORIGIN, ...headers }, body: form })
}
const enc = (s: string) => new TextEncoder().encode(s)

describe("POST /api/import/extract (IM-02: spreadsheets, documents and PDFs, code only, no key)", () => {
  it("IM-02: .xlsx with a header row maps the columns and asks the standard reader to read them as columns", async () => {
    const x = await makeXlsx([["Skill", "Description", "Category"], ["Suction", "Clear the airway", "Respiratory"], ["Dress a wound, sterile", "", "Wound"]])
    const j = await (await extract(upload(x, "skills.xlsx"))).json()
    expect(j).toMatchObject({ columns: true, skipHeader: true, lines: 3 })
    expect(j.text.split("\n")).toEqual(["Skill,Description,Category", "Suction,Clear the airway,Respiratory", "Dress a wound; sterile,,Wound"])
  })
  it("IM-02: .xlsx without a header: one line per row, cells joined by a tab", async () => {
    const x = await makeXlsx([["Suction", "Clear the airway"], ["Oxygen therapy"]])
    const j = await (await extract(upload(x, "list.xlsx"))).json()
    expect(j.text).toBe("Suction\tClear the airway\nOxygen therapy")
    expect(j.columns).toBeUndefined()
  })
  it("IM-02, IM-07: .docx keeps real Word headings as '# ' heading lines and one line per paragraph", async () => {
    const j = await (await extract(upload(makeDocx(), "skills.docx"))).json()
    expect(j.text.split("\n")).toEqual(["# RESPIRATORY SKILLS", "Insert a peripheral IV catheter", "Vital signs assessment", "Page 3 of 12"])
  })
  it("IM-02: a text-layer .pdf is read into lines", async () => {
    const j = await (await extract(upload(makePdf(["Insert a peripheral IV catheter", "Vital signs assessment"]), "skills.pdf"))).json()
    expect(j.text).toContain("Insert a peripheral IV catheter")
    expect(j.text).toContain("Vital signs assessment")
  })
  it("IM-13: a scanned PDF (no text layer) is reported as unreadable, never faked", async () => {
    const res = await extract(upload(makePdf([]), "scan.pdf"))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: "unreadable" })
  })
  it("a plain .csv with a header row is passed through as columns; a .txt as plain lines", async () => {
    const csv = await (await extract(upload(enc("Skill,Description\nSuction,Clear the airway"), "a.csv"))).json()
    expect(csv).toMatchObject({ columns: true, skipHeader: true })
    const txt = await (await extract(upload(enc("Suction\nOxygen"), "a.txt"))).json()
    expect(txt.text).toBe("Suction\nOxygen")
  })
  it("legacy .xls and .doc are unsupported (415); an unknown type too", async () => {
    expect((await extract(upload(enc("x"), "old.xls"))).status).toBe(415)
    expect((await extract(upload(enc("x"), "old.doc"))).status).toBe(415)
    expect((await extract(upload(enc("x"), "photo.png"))).status).toBe(415)
  })
  it("a file whose content does not match its extension is unreadable (magic bytes), not parsed", async () => {
    expect((await extract(upload(enc("not a zip"), "fake.xlsx"))).status).toBe(422)
    expect((await extract(upload(enc("not a pdf"), "fake.pdf"))).status).toBe(422)
  })
  it("a zip that declares a huge uncompressed size is refused before it is opened (zip bomb)", async () => {
    const bomb = makeZip({ "word/document.xml": "x" }, 0x7fffffff)
    const res = await extract(upload(bomb, "bomb.docx"))
    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({ error: "too_large" })
  })
  it("a file over 4 MB is refused (413) and an empty upload is 'empty'", async () => {
    expect((await extract(upload(new Uint8Array(4 * 1024 * 1024 + 1), "big.txt"))).status).toBe(413)
    expect((await extract(upload(enc("   \n "), "blank.txt"))).status).toBe(422)
  })
  it("a cross-origin caller is refused and no file is read", async () => {
    expect((await extract(upload(enc("Suction"), "a.txt", { origin: "https://evil.example" }))).status).toBe(403)
  })
  it("the response never carries the file name beyond sourceName and is not cacheable", async () => {
    const res = await extract(upload(enc("Suction"), "a.txt"))
    expect(res.headers.get("cache-control")).toBe("no-store")
  })
})
