// SYNTHETIC file fixtures generated in code (no binary files in the repo): a minimal .docx and .pdf built by hand, an .xlsx built with
// exceljs, and a zip whose central directory declares an oversized entry. They exercise OUR extractor, nothing about any real client file.
import ExcelJS from "exceljs"

function crc32(buf: Uint8Array): number {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

/** A stored (uncompressed) zip. `declaredSize` overrides the central-directory uncompressed size to simulate a zip bomb. */
export function makeZip(files: Record<string, string>, declaredSize?: number): Uint8Array {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  const u32 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255])
  const u16 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255])
  const cat = (...a: Uint8Array[]) => {
    const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0))
    let o = 0
    for (const x of a) {
      out.set(x, o)
      o += x.length
    }
    return out
  }
  for (const [name, content] of Object.entries(files)) {
    const n = enc.encode(name)
    const d = enc.encode(content)
    const crc = crc32(d)
    const local = cat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(d.length), u32(d.length), u16(n.length), u16(0), n, d)
    central.push(cat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(d.length), u32(declaredSize ?? d.length), u16(n.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), n))
    parts.push(local)
    offset += local.length
  }
  const cd = cat(...central)
  const end = cat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cd.length), u32(offset), u16(0))
  return cat(...parts, cd, end)
}

/** A real, minimal .docx: a heading and three paragraphs, so mammoth yields an <h1> and <p> elements. */
export function makeDocx(): Uint8Array {
  const doc = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>RESPIRATORY SKILLS</w:t></w:r></w:p>
<w:p><w:r><w:t>Insert a peripheral IV catheter</w:t></w:r></w:p>
<w:p><w:r><w:t>Vital signs assessment</w:t></w:r></w:p>
<w:p><w:r><w:t>Page 3 of 12</w:t></w:r></w:p></w:body></w:document>`
  const styles = `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>`
  return makeZip({
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "word/document.xml": doc,
    "word/styles.xml": styles,
  })
}

/** A minimal one-page PDF. With `text` it carries a text layer; with no text it models a scanned page (no text to read). */
export function makePdf(lines: string[]): Uint8Array {
  const stream = lines.length ? `BT /F1 12 Tf 72 720 Td 14 TL ${lines.map((l) => `(${l.replace(/[()\\]/g, "")}) Tj T*`).join(" ")} ET` : ""
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]
  let out = "%PDF-1.4\n"
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(out)
}

export async function makeXlsx(rows: string[][], sheetName = "Skills"): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  rows.forEach((r) => ws.addRow(r))
  return new Uint8Array(await wb.xlsx.writeBuffer())
}
