'use client';

import { useState } from 'react';
import { Button, Textarea } from '@exxatdesignux/ui';

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

  if (!isOpen) return null;

  return (
    <div
      className="rounded-xl border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--card)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i
            className="fa-light fa-triangle-exclamation fa-fw"
            aria-hidden="true"
            style={{ color: 'var(--state-warning-darkest)', fontSize: 13 }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
            Report issue to faculty
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <i className="fa-light fa-xmark" aria-hidden="true" />
        </Button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
        Describe the issue (typo, ambiguous wording, suspected error). Faculty will review post-exam — you will not receive a real-time response.
      </p>

      {/* Textarea */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. Option C and D appear to describe the same condition…"
        aria-label="Describe the issue"
        className="resize-none"
      />

      {/* Footer row */}
      <div className="flex items-center justify-between gap-3">
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
              Saved · Faculty will review post-exam
            </>
          ) : (
            'Saved comments are submitted with your exam'
          )}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
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
      </div>
    </div>
  );
}
