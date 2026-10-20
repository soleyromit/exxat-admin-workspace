#!/usr/bin/env node
// Writes the sample skills checklist used by the v2 import demo: a one page, text-layer PDF with no external fonts.
//   node scripts/make-v2-sample-pdf.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(HERE, '../public/v2/sample-skills-checklist.pdf')

const lines = [
  ['Harbor General Hospital', 16],
  ['Nursing skills checklist 2026', 12],
  ['Page 1 of 1', 10],
  ['', 10],
  ['Respiratory care', 13],
  ['1. Tracheostomy suctioning - open and closed system', 11],
  ['2. Oxygen delivery device setup', 11],
  ['3. Incentive spirometry coaching', 11],
  ['Cardiac care', 13],
  ['4. Telemetry lead placement', 11],
  ['5. Peripheral IV catheter insertion', 11],
  ['6. Central line dressing change', 11],
  ['Medication safety', 13],
  ['- Oral medication administration', 11],
  ['- Insulin pen administration - includes two-nurse check', 11],
  ['- High-alert medication double check', 11],
  ['Mobility and safety', 13],
  ['1. Safe patient transfer with gait belt', 11],
  ['2. Fall risk bundle', 11],
  ['', 10],
  ['Signature of unit educator: ______________', 10],
  ['Date reviewed: ____________', 10],
]

const esc = (t) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
let y = 790
let content = 'BT\n'
for (const [text, size] of lines) {
  content += `/F1 ${size} Tf 1 0 0 1 56 ${y} Tm (${esc(text)}) Tj\n`
  y -= size + 10
}
content += 'ET'

const objs = []
objs.push('<< /Type /Catalog /Pages 2 0 R >>')
objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>')
objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
objs.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)

let pdf = '%PDF-1.4\n'
const offsets = []
objs.forEach((o, i) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
})
const xref = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, pdf, 'latin1')
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes')
