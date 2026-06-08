'use client';

/**
 * Question report panel — Aarti-mandated:
 *
 *   "During an exam, students should be able to flag questions they believe
 *    have errors via a comment box. Faculty would review these post-exam,
 *    not in real time."
 *
 * Rendered as a DS Sheet (right side) so the question + reference content
 * stays fully visible while the student writes their report.
 */

import { useState } from 'react';
import { Sheet, SheetContent, Button, Textarea } from '@exxatdesignux/ui';

export interface QuestionCommentBoxProps {
  questionId: number;
  initialComment?: string;
  onSave?: (questionId: number, comment: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function QuestionCommentBox({ questionId, initialComment = '', onSave, isOpen, onClose }: QuestionCommentBoxProps) {
  const [text, setText] = useState(initialComment);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.(questionId, text.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="p-0 gap-0 flex flex-col border-s border-border bg-card"
        style={{ width: 380, maxWidth: '90vw' }}
        aria-label="Report issue to faculty"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <i
              className="fa-light fa-triangle-exclamation fa-fw"
              aria-hidden="true"
              style={{ color: 'var(--state-warning-darkest)', fontSize: 14 }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
              Report issue to faculty
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close report panel"
          >
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto px-5 py-5">
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            Describe the issue (typo, ambiguous wording, suspected error). Faculty will review post-exam — you will not receive a real-time response.
          </p>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="e.g. Option C and D appear to describe the same condition…"
            aria-label="Describe the issue"
            className="resize-none"
          />

          <p
            aria-live="polite"
            style={{
              fontSize: 12,
              color: saved ? 'var(--state-success-dark)' : 'var(--muted-foreground)',
              fontWeight: saved ? 600 : 400,
            }}
          >
            {saved ? (
              <>
                <i className="fa-solid fa-check me-1" aria-hidden="true" />
                Comment saved · Faculty will review post-exam
              </>
            ) : (
              'Saved comments are submitted with your exam'
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0 px-5 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={text.trim().length === 0}
          >
            <i className="fa-light fa-floppy-disk" aria-hidden="true" />
            Submit
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
