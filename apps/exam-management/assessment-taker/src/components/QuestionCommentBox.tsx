'use client';

import { useState } from 'react';
import { Button, Textarea } from '@exxatdesignux/ui';

export interface QuestionCommentBoxProps {
  questionId: number;
  initialComment?: string;
  onSave?: (questionId: number, comment: string) => void;
  onClose?: () => void;
}

export function QuestionCommentBox({ questionId, initialComment = '', onSave, onClose }: QuestionCommentBoxProps) {
  const [text, setText] = useState(initialComment);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.(questionId, text.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <aside
      aria-label="Report issue to faculty"
      className="absolute top-3 bottom-3 end-3 flex flex-col rounded-xl border border-border bg-card overflow-hidden z-10"
      style={{ width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <i
            className="fa-light fa-triangle-exclamation fa-fw text-sm"
            aria-hidden="true"
            style={{ color: 'var(--state-warning-darkest)' }}
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Report issue to faculty
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close report panel">
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Describe the issue (typo, ambiguous wording, suspected error). Faculty will review post-exam — you will not receive a real-time response.
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="e.g. Option C and D appear to describe the same condition…"
          aria-label="Describe the issue"
          className="resize-none"
        />

        <p
          aria-live="polite"
          className="text-xs"
          style={{
            color: saved ? 'var(--state-success-dark)' : 'var(--muted-foreground)',
            fontWeight: saved ? 600 : 400,
          }}
        >
          {saved ? (
            <>
              <i className="fa-solid fa-check me-1" aria-hidden="true" />
              Saved · Faculty will review post-exam
            </>
          ) : (
            'Saved comments are submitted with your exam'
          )}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 flex-shrink-0 px-4 py-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={text.trim().length === 0}
        >
          Submit
        </Button>
      </div>
    </aside>
  );
}
