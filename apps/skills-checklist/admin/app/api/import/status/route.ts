// GET /api/import/status: is the AI assist available, and which file types the extractor reads. Never returns the key or anything derived from it.
import { aiAvailable } from "@/lib/import-ai/env"
import { MAX_UPLOAD_BYTES } from "@/lib/import-ai/extract"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET() {
  return Response.json(
    { ai: aiAvailable(), extractors: { xlsx: true, docx: true, pdf: true }, maxUploadBytes: MAX_UPLOAD_BYTES },
    { headers: { "Cache-Control": "no-store" } },
  )
}
