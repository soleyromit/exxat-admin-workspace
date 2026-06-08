'use client';

/**
 * GlobalReferencePanel — assessment-level reference sheet accessible throughout the exam.
 *
 * Vishaka May 14: "Some formulas the instructor wants to upload which can be for
 * multiple questions... always available. Just like the calculator — open the resource
 * document. It is behind a click."
 *
 * Tab-per-reference layout: each ref gets its own full-panel content area so
 * PDF/image types aren't crammed into a vertical scroll stack alongside text refs.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Badge, Button,
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@exxatdesignux/ui';
import type { AssessmentReference } from '../data/assessments';

interface GlobalReferencePanelProps {
  onClose: () => void;
  refs: AssessmentReference[];
}

export function GlobalReferencePanel({ onClose, refs }: GlobalReferencePanelProps) {
  const [activeRef, setActiveRef] = useState(refs[0]?.id ?? '');
  const current = refs.find((r) => r.id === activeRef) ?? refs[0];

  if (refs.length === 0) return null;

  return (
    <aside
      aria-label="Exam reference materials"
      className="flex flex-col border-l border-border flex-shrink-0 overflow-hidden bg-muted w-[340px]"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <i className="fa-light fa-book-open fa-fw text-sm text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Exam References</span>
          <Badge variant="secondary" className="rounded-full px-1.5 tabular-nums">
            {refs.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close reference panel"
        >
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </Button>
      </div>

      {/* ── Dropdown selector ────────────────────────────────────────────── */}
      {refs.length > 1 && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-border">
          <Select value={activeRef} onValueChange={setActiveRef}>
            <SelectTrigger className="w-full" aria-label="Select reference">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {refs.map((ref) => (
                <SelectItem key={ref.id} value={ref.id}>
                  <i className={`fa-light ${ref.icon} fa-fw me-1.5`} aria-hidden="true" />
                  {ref.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {current?.type === 'formula' && current.formulas && (
          <FormulaBlock formulas={current.formulas} />
        )}
        {current?.type === 'table' && current.headers && current.rows && (
          <TableBlock headers={current.headers} rows={current.rows} note={current.note} />
        )}
        {current?.type === 'text' && current.paragraphs && (
          <TextBlock paragraphs={current.paragraphs} />
        )}
        {current?.type === 'image' && current.url && (
          <ImageBlock url={current.url} label={current.label} />
        )}
        {current?.type === 'pdf' && current.url && (
          <PdfBlock url={current.url} label={current.label} />
        )}
        {current?.type === 'doc' && current.url && (
          <DocBlock url={current.url} label={current.label} />
        )}
      </div>
    </aside>
  );
}

// ─── Formula block ────────────────────────────────────────────────────────────
function FormulaBlock({ formulas }: { formulas: NonNullable<AssessmentReference['formulas']> }) {
  return (
    <div className="flex flex-col gap-4">
      {formulas.map((f, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">{f.name}</p>
          <p className="border-l-2 border-border pl-3 py-1 font-mono text-base text-foreground leading-snug">{f.formula}</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{f.variables}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Table block ─────────────────────────────────────────────────────────────
function TableBlock({ headers, rows, note }: {
  headers: string[];
  rows: string[][];
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {note && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <i className="fa-light fa-circle-info me-1" aria-hidden="true" />
          {note}
        </p>
      )}
    </div>
  );
}

// ─── Text block ───────────────────────────────────────────────────────────────
function TextBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm text-foreground leading-relaxed">{p}</p>
      ))}
    </div>
  );
}

// ─── Image block ──────────────────────────────────────────────────────────────
function ImageBlock({ url, label }: { url: string; label: string }) {
  const [error, setError] = useState(false);
  const handleError = useCallback(() => setError(true), []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <i className="fa-light fa-image-slash fa-2x" aria-hidden="true" />
        <span className="text-xs">Image could not be loaded</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={label}
      className="max-w-full h-auto rounded"
      onError={handleError}
    />
  );
}

// ─── PDF blob generator — produces a real in-memory PDF for mock/relative URLs ─
function buildLabeledPdf(label: string): Blob {
  type PdfLine = { text: string; bold?: boolean; size: number };
  const lines: PdfLine[] = [
    { text: label, bold: true, size: 14 },
    { text: '', size: 11 },
    { text: 'Reference document — for exam use only.', size: 11 },
    { text: '', size: 11 },
    { text: 'This document has been uploaded by your instructor', size: 11 },
    { text: 'as a supplementary reference for this assessment.', size: 11 },
    { text: '', size: 11 },
    { text: 'Refer to this material as needed during your exam.', size: 11 },
  ];

  const streamParts: string[] = [];
  let y = 740;
  for (const { text, bold, size } of lines) {
    if (!text) { y -= 10; continue; }
    const safe = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamParts.push(`BT ${bold ? '/FB' : '/F1'} ${size} Tf 40 ${y} Td (${safe}) Tj ET`);
    y -= size + (bold ? 9 : 5);
  }
  const stream = streamParts.join('\n');

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  const addObj = (n: number, dict: string, streamContent?: string) => {
    offsets.push(body.length);
    if (streamContent !== undefined) {
      body += `${n} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    } else {
      body += `${n} 0 obj\n${dict}\nendobj\n`;
    }
  };
  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /FB 6 0 R >> >> >>');
  addObj(4, '', stream);
  addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObj(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const xrefPos = body.length;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return new Blob([body + xref], { type: 'application/pdf' });
}

// ─── PDF block ────────────────────────────────────────────────────────────────
function PdfBlock({ url, label }: { url: string; label: string }) {
  const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
  const [blobSrc, setBlobSrc] = useState('');

  useEffect(() => {
    if (isAbsolute) return;
    const blob = buildLabeledPdf(label);
    const blobUrl = URL.createObjectURL(blob);
    setBlobSrc(blobUrl);
    return () => URL.revokeObjectURL(blobUrl);
  }, [label, isAbsolute]);

  const embedSrc = isAbsolute ? url : blobSrc;

  return (
    <div className="flex flex-col gap-2 h-full" style={{ minHeight: 400 }}>
      {embedSrc ? (
        <embed
          src={embedSrc}
          type="application/pdf"
          title={label}
          className="w-full flex-1 rounded"
          style={{ minHeight: 400 }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <i className="fa-light fa-spinner-third fa-spin fa-2x" aria-hidden="true" />
        </div>
      )}
      <a
        href={embedSrc || '#'}
        download={`${label}.pdf`}
        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
      >
        <i className="fa-light fa-arrow-down-to-line fa-fw" aria-hidden="true" />
        Download PDF
      </a>
    </div>
  );
}

// ─── Doc block (Word / Google Doc — download only) ────────────────────────────
function DocBlock({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <i className="fa-light fa-file-word fa-2x text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground">Document files cannot be previewed in-browser.</p>
        </div>
      </div>
      <a
        href={url}
        download
        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
      >
        <i className="fa-light fa-arrow-down-to-line fa-fw" aria-hidden="true" />
        Download to view
      </a>
    </div>
  );
}
