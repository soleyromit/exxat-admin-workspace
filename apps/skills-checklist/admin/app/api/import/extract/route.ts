// POST /api/import/extract: read a spreadsheet, document or text-layer PDF into plain lines (IM-02). Code only: no AI, no key.
// The upload is processed in memory, never written to disk, and its contents are never logged.
import { extractFromBytes, MAX_UPLOAD_BYTES } from "@/lib/import-ai/extract"
import { clientKey, interpretLimiter, isSameOrigin } from "@/lib/import-ai/guards"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return Response.json({ error: "forbidden" }, { status: 403, headers: NO_STORE })
  if (!interpretLimiter.allow(`x:${clientKey(req.headers)}`)) return Response.json({ error: "rate_limited" }, { status: 429, headers: NO_STORE })
  const declared = Number(req.headers.get("content-length") ?? "0")
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return Response.json({ error: "too_large" }, { status: 413, headers: NO_STORE })
  let file: File | null = null
  try {
    const form = await req.formData()
    const f = form.get("file")
    file = f instanceof File ? f : null
  } catch {
    return Response.json({ error: "unreadable" }, { status: 400, headers: NO_STORE })
  }
  if (!file) return Response.json({ error: "empty" }, { status: 400, headers: NO_STORE })
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "too_large" }, { status: 413, headers: NO_STORE })
  const out = await extractFromBytes(new Uint8Array(await file.arrayBuffer()), file.name.slice(0, 120))
  if (!out.ok) return Response.json({ error: out.error }, { status: out.error === "too_large" ? 413 : out.error === "unsupported" ? 415 : 422, headers: NO_STORE })
  return Response.json({ text: out.text, sourceName: out.sourceName, columns: out.columns, skipHeader: out.skipHeader, lines: out.lines, truncated: out.truncated }, { headers: NO_STORE })
}
