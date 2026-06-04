'use client';

/**
 * GlobalReferencePanel — assessment-level reference sheet accessible throughout the exam.
 *
 * Vishaka May 14: "Some formulas the instructor wants to upload which can be for
 * multiple questions... always available. Just like the calculator — open the resource
 * document. It is behind a click."
 *
 * Rendered as an inline flex sibling of <main> (not a floating overlay) so the student
 * sees questions on the left and references on the right simultaneously.
 * Multiple references are stacked vertically, all expanded — scroll to see all.
 */

import { Badge, Button, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@exxatdesignux/ui';
import type { AssessmentReference } from '../data/assessments';

interface GlobalReferencePanelProps {
  onClose: () => void;
  refs: AssessmentReference[];
}

export function GlobalReferencePanel({ onClose, refs }: GlobalReferencePanelProps) {
  if (refs.length === 0) return null;

  return (
    <aside
      aria-label="Exam reference materials"
      className="flex flex-col border-l border-border flex-shrink-0 overflow-hidden bg-card w-[340px]"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-border bg-muted">
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

      {/* ── Reference sections — all expanded, scroll to see all ────────── */}
      <div className="flex-1 overflow-y-auto">
        {refs.map((ref, i) => (
          <RefSection key={ref.id} ref_={ref} isLast={i === refs.length - 1} />
        ))}
      </div>
    </aside>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function RefSection({ ref_, isLast }: { ref_: AssessmentReference; isLast: boolean }) {
  return (
    <section className={isLast ? '' : 'border-b border-border'}>
      <div className="flex items-center gap-2 px-4 py-2.5 sticky top-0 z-10 border-b border-border bg-muted">
        <i className={`fa-light ${ref_.icon} fa-fw text-[13px] text-muted-foreground`} aria-hidden="true" />
        <span className="text-xs font-semibold text-foreground">{ref_.label}</span>
      </div>

      <div className="px-4 py-3">
        {ref_.type === 'formula' && ref_.formulas && (
          <FormulaBlock formulas={ref_.formulas} />
        )}
        {ref_.type === 'table' && ref_.headers && ref_.rows && (
          <TableBlock headers={ref_.headers} rows={ref_.rows} note={ref_.note} />
        )}
        {ref_.type === 'text' && ref_.paragraphs && (
          <TextBlock paragraphs={ref_.paragraphs} />
        )}
      </div>
    </section>
  );
}

// ─── Formula block ────────────────────────────────────────────────────────────
function FormulaBlock({ formulas }: { formulas: NonNullable<AssessmentReference['formulas']> }) {
  return (
    <div className="flex flex-col gap-3">
      {formulas.map((f, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">{f.name}</p>
          <div className="rounded-md px-3 py-2 font-mono text-sm text-foreground bg-muted border border-border">
            {f.formula}
          </div>
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
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className="h-8 px-2.5 text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="px-2.5 py-1.5 text-xs">
                    {cell}
                  </TableCell>
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
