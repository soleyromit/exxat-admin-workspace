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

import { useState, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState(refs[0]?.id ?? '');

  if (refs.length === 0) return null;

  return (
    <aside
      aria-label="Exam reference materials"
      className="flex flex-col border-l border-border flex-shrink-0 overflow-hidden bg-card w-[340px]"
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

      {/* ── Reference picker ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue>
              {(() => {
                const active = refs.find(r => r.id === activeTab);
                return active ? (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <i className={`fa-light ${active.icon} fa-fw flex-shrink-0`} aria-hidden="true" />
                    <span className="truncate">{active.label}</span>
                  </span>
                ) : null;
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {refs.map((ref) => (
              <SelectItem key={ref.id} value={ref.id} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <i className={`fa-light ${ref.icon} fa-fw`} aria-hidden="true" />
                  {ref.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Active reference content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {refs.map((ref) => ref.id === activeTab && (
          <div key={ref.id}>
            {ref.type === 'formula' && ref.formulas && (
              <FormulaBlock formulas={ref.formulas} />
            )}
            {ref.type === 'table' && ref.headers && ref.rows && (
              <TableBlock headers={ref.headers} rows={ref.rows} note={ref.note} />
            )}
            {ref.type === 'text' && ref.paragraphs && (
              <TextBlock paragraphs={ref.paragraphs} />
            )}
            {ref.type === 'image' && ref.url && (
              <ImageBlock url={ref.url} label={ref.label} />
            )}
            {ref.type === 'pdf' && ref.url && (
              <PdfBlock url={ref.url} label={ref.label} />
            )}
            {ref.type === 'doc' && ref.url && (
              <DocBlock url={ref.url} label={ref.label} />
            )}
          </div>
        ))}
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
          <p className="text-xs text-muted-foreground leading-relaxed">{f.variables}</p>
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

// ─── PDF block ────────────────────────────────────────────────────────────────
function PdfBlock({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex flex-col gap-2 h-full" style={{ minHeight: 400 }}>
      <embed
        src={url}
        type="application/pdf"
        title={label}
        className="w-full flex-1 rounded"
        style={{ minHeight: 400 }}
      />
      <a
        href={url}
        download
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
