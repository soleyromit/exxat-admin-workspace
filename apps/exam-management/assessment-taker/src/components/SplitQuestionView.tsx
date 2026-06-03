import React, { useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
import { QuestionCommentBox } from './QuestionCommentBox';
import { Button as DSButton, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Tabs, TabsList, TabsTrigger, TabsContent } from '@exxat/ds/packages/ui/src';

function ImagePanel({ src, alt }: {src: string;alt: string;}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden border flex items-center justify-center relative"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--muted)',
        minHeight: '280px'
      }}>
      
      {error ?
      <div
        className="flex flex-col items-center gap-3 py-12"
        style={{
          color: 'var(--muted-foreground)'
        }}>
        
          <i className="fa-light fa-image-slash" aria-hidden="true" style={{ fontSize: '2.5em' }} />
          <span className="text-sm">
            Image could not be loaded
          </span>
        </div> :

      <>
          {!loaded &&
        <div
          className="flex flex-col items-center gap-3 py-12 absolute inset-0 z-10 justify-center"
          style={{
            color: 'var(--muted-foreground)'
          }}>
          
              <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: '1.5em' }} />
              <span className="text-sm">Loading image…</span>
            </div>
        }
          <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-lg"
          style={{
            maxHeight: '500px',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)} />
        
        </>
      }
    </div>);

}
// ─── Per-question reference panel (embedded in split layout) ─────────────────
function QuestionReferencePanel({
  references,
  zoomPercent,
}: {
  references: NonNullable<Question['references']>;
  zoomPercent: number;
}) {
  const renderRef = (ref: NonNullable<Question['references']>[0]) => {
    if (ref.type === 'image') {
      return (
        <img
          src={ref.url}
          alt={ref.label}
          style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
        />
      );
    }
    if (ref.type === 'html') {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: ref.url }}
          style={{ lineHeight: 1.7, color: 'var(--foreground)' }}
        />
      );
    }
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5em', minHeight: 0 }}>
        <iframe
          src={ref.url}
          title={ref.label}
          style={{ flex: 1, border: 'none', borderRadius: 8, minHeight: 360, width: '100%' }}
        />
        <a
          href={ref.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.75em', color: 'var(--exam-accent)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.3em',
          }}
        >
          <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
          Open in new tab
        </a>
      </div>
    );
  };

  return (
    <div
      className="flex-1 min-h-0 overflow-auto rounded-2xl border shadow-sm flex flex-col"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
      role="complementary"
      aria-label="Question reference material"
    >
      <div style={{ zoom: zoomPercent / 100, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {references.length > 1 ? (
          <Tabs defaultValue="0" className="flex-col flex-1 min-h-0 gap-0">
            <TabsList
              variant="line"
              className="w-full justify-start bg-muted border-b border-border rounded-none p-0 h-auto overflow-x-auto flex-nowrap gap-0"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {references.map((ref, i) => (
                <TabsTrigger
                  key={i}
                  value={String(i)}
                  className="rounded-none h-auto px-4 py-2.5 text-sm font-semibold flex-none"
                >
                  {ref.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {references.map((ref, i) => (
              <TabsContent
                key={i}
                value={String(i)}
                className="flex-1 overflow-auto p-[1em] flex flex-col gap-[0.625em] min-h-0 mt-0"
              >
                {renderRef(ref)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: '1em', display: 'flex', flexDirection: 'column', gap: '0.625em', minHeight: 0 }}>
            {renderRef(references[0])}
          </div>
        )}
      </div>
    </div>
  );
}

import {
  RadioMCQRenderer,
  CheckboxRenderer,
  CrossOutRenderer,
  HighlightRenderer,
  ShortAnswerRenderer,
  FillBlankRenderer,
  MatchingRenderer,
  AnatomyRenderer,
  EssayRenderer,
  WordHighlightRenderer,
  ChartRenderer } from
'./QuestionRenderers';
import { VirtualKeyboard } from './VirtualKeyboard';
export interface SplitQuestionViewProps {
  question: Question;
  questionIndex: number;
  selectedAnswer: any;
  onSelectAnswer: (questionId: number, answer: any) => void;
  zoomPercent: number;
  showKeyboard?: boolean;
  onToggleKeyboard?: () => void;
  needsKeyboard?: boolean;
  voiceNarrator?: boolean;
  allowComments?: boolean;
  comment?: string;
  onCommentChange?: (questionId: number, comment: string) => void;
  showReport?: boolean;
  onCloseReport?: () => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
}
export function SplitQuestionView({
  question,
  questionIndex,
  selectedAnswer,
  onSelectAnswer,
  zoomPercent,
  showKeyboard = false,
  onToggleKeyboard,
  needsKeyboard = false,
  voiceNarrator = false,
  allowComments = false,
  comment = '',
  onCommentChange,
  showReport = false,
  onCloseReport,
  isFlagged = false,
  onToggleFlag,
}: SplitQuestionViewProps) {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const pdfTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setPdfLoaded(false);
    setPdfError(false);
  }, [question.id]);
  // PDF load detection: if iframe hasn't signaled load after 5s, show fallback
  useEffect(() => {
    if (question.type === 'pdf' && question.pdfUrl) {
      setPdfLoaded(false);
      setPdfError(false);
      pdfTimerRef.current = setTimeout(() => {
        setPdfError(true);
      }, 5000);
    }
    return () => {
      if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current);
    };
  }, [question.id, question.type, question.pdfUrl]);
  // Voice Narrator
  useEffect(() => {
    if (voiceNarrator && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Question ${questionIndex + 1}. ${question.text}`
      );
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [question.id, question.text, questionIndex, voiceNarrator]);
  const speak = (text: string) => {
    if (!voiceNarrator || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
  const hasRef = (question.references?.length ?? 0) > 0;
  const hasMedia =
  hasRef ||
  question.imageUrl ||
  question.videoUrl ||
  question.audioUrl ||
  question.pdfUrl ||
  question.type === 'case-study' ||
  question.type === 'table' ||
  question.type === 'passage' ||
  question.type === 'chart';
  const renderQuestionStem = () =>
  <div className="mb-[1.5em]">
      {/* Single row: number · title (flex-1, wraps) · icons */}
      <div className="flex items-start gap-2 mb-[0.75em]">
        <span
          className="font-bold text-[1.125em] shrink-0"
          style={{ color: 'var(--foreground)', marginTop: '0.1em' }}
        >
          {questionIndex + 1}.
        </span>

        <h2
          className="text-[1.125em] font-semibold leading-relaxed flex-1 transition-colors"
          style={{
            color: 'var(--foreground)',
            cursor: voiceNarrator ? 'pointer' : undefined,
            borderRadius: '8px',
            padding: voiceNarrator ? '0.15em 0.4em' : undefined,
            margin: voiceNarrator ? '-0.15em -0.4em' : undefined,
          }}
          onMouseEnter={(e) => {
            if (voiceNarrator) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--exam-accent-light)';
              speak(question.text);
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '';
            stopSpeaking();
          }}
        >
          {question.text}
        </h2>

        {/* Bookmark — right-aligned, top-anchored */}
        {onToggleFlag && (
          <Tooltip content={isFlagged ? 'Remove bookmark' : 'Bookmark'} position="bottom">
            <DSButton
              variant="ghost"
              size="icon-sm"
              onClick={onToggleFlag}
              aria-label={isFlagged ? 'Remove bookmark from this question' : 'Bookmark this question'}
              style={isFlagged ? {
                backgroundColor: 'var(--state-flagged-bg)',
                color: 'var(--state-flagged-text)',
              } : { color: 'var(--muted-foreground)' }}
            >
              <i className={`${isFlagged ? 'fa-solid' : 'fa-regular'} fa-bookmark`} aria-hidden="true" style={{ fontSize: '1em' }} />
            </DSButton>
          </Tooltip>
        )}
      </div>
    </div>;


  /**
   * Renders ONLY the media/context portion — NO answer choices.
   * Answer choices are rendered separately via renderInteractive().
   */
  const renderMediaOrContext = () => {
    let content = null;
    if (question.type === 'case-study' && question.tabs) {
      content = (
        <Tabs
          defaultValue="0"
          className="flex flex-col rounded-xl border overflow-hidden gap-0"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', minHeight: '300px' }}
        >
          <TabsList
            variant="line"
            className="w-full justify-start bg-muted border-b border-border rounded-none p-0 h-auto overflow-x-auto flex-nowrap gap-0"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {question.tabs.map((t, i) => (
              <TabsTrigger
                key={i}
                value={String(i)}
                className="rounded-none h-auto px-4 py-2.5 text-sm font-semibold flex-none"
                aria-label={`View ${t.title} tab`}
              >
                {t.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {question.tabs.map((tab, i) => (
            <TabsContent
              key={i}
              value={String(i)}
              className="flex-1 p-[1.5em] overflow-y-auto space-y-[1em] mt-0"
            >
              {tab.content.map((p, j) => (
                <p key={j} className="text-[0.875em] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {p}
                </p>
              ))}
            </TabsContent>
          ))}
          {question.imageUrl && (
            <div className="p-[1em] border-t" style={{ borderColor: 'var(--border)' }}>
              <ImagePanel src={question.imageUrl} alt="Case study reference image" />
            </div>
          )}
        </Tabs>
      );

    } else if (question.imageUrl) {
      content =
      <ImagePanel src={question.imageUrl} alt="Question reference image" />;

    } else if (question.videoUrl) {
      content =
      <div
        className="rounded-xl overflow-hidden border flex flex-col"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'black',
          minHeight: '280px'
        }}>
        
          <video
          src={question.videoUrl}
          controls
          className="w-full"
          style={{
            maxHeight: '400px'
          }}
          aria-label="Question video" />
        
        </div>;

    } else if (question.audioUrl) {
      content =
      <div
        className="rounded-xl border p-[1.5em] flex flex-col items-center justify-center gap-4"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          minHeight: '120px'
        }}>
        
          <audio
          src={question.audioUrl}
          controls
          className="w-full max-w-md"
          aria-label="Question audio" />
        
        </div>;

    } else if (question.type === 'table' && question.tableData) {
      // Render ONLY the table — no answer choices
      content =
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <Table>
            <TableHeader style={{ backgroundColor: 'var(--muted)' }}>
              <TableRow>
                {question.tableData.headers.map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {question.tableData.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>;

    } else if (question.type === 'pdf' && question.pdfUrl) {
      // PDF viewer with robust fallback
      content =
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          minHeight: '500px'
        }}>
        
          {/* Always show the iframe attempt */}
          {!pdfError &&
        <iframe
          src={question.pdfUrl}
          className="w-full flex-1"
          style={{
            minHeight: '460px',
            border: 'none',
            display: 'block'
          }}
          title="PDF Viewer — Clinical guidelines document"
          onLoad={() => {
            setPdfLoaded(true);
            if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current);
          }} />

        }
          {/* Fallback when PDF can't load */}
          {pdfError && !pdfLoaded &&
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
          style={{
            minHeight: '460px'
          }}>
          
              <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--exam-accent-light)'
            }}>
            
                <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: '2em', color: 'var(--exam-accent)' }} />
            
              </div>
              <div className="text-center">
                <p
              className="font-semibold text-[1em] mb-1"
              style={{
                color: 'var(--foreground)'
              }}>
              
                  PDF Document
                </p>
                <p
              className="text-[0.875em] mb-4"
              style={{
                color: 'var(--muted-foreground)'
              }}>
              
                  The PDF viewer could not load in this environment.
                </p>
                <a
              href={question.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[0.875em] transition-colors"
              style={{
                backgroundColor: 'var(--exam-accent)',
                color: 'var(--exam-accent-text)'
              }}>
              
                  <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: '1em' }} />
                  Open PDF in New Tab
                </a>
              </div>
            </div>
        }
          {/* Footer link always visible */}
          <div
          className="flex items-center gap-2 px-4 py-2 border-t shrink-0"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--muted)'
          }}>
          
            <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: '0.875em', color: 'var(--muted-foreground)' }} />
          
            <a
            href={question.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium underline"
            style={{
              color: 'var(--exam-accent)'
            }}>
            
              Open PDF in new tab
            </a>
          </div>
        </div>;

    } else if (question.type === 'passage' && question.passageText) {
      // Render ONLY the passage text — no answer choices
      content =
      <div
        className="p-[1.5em] border rounded-xl overflow-y-auto text-[1em] leading-relaxed"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          maxHeight: '500px'
        }}>
        
          {question.passageText}
        </div>;

    } else if (question.type === 'chart') {
      content =
      <ChartRenderer
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer} />;


    }
    return (
      <div className="flex flex-col gap-3">
        {content}
        {question.caption &&
        <div
          className="text-sm p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)'
          }}>
          
            <strong>Caption:</strong> {question.caption}
          </div>
        }
        {question.chartData?.caption && !question.caption &&
        <div
          className="text-sm p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)'
          }}>
          
            <strong>Caption:</strong> {question.chartData.caption}
          </div>
        }
      </div>);

  };
  const renderInteractive = () => {
    const props = {
      question,
      selectedAnswer,
      onSelectAnswer,
      voiceNarrator
    };
    switch (question.type) {
      case 'mcq':
      case 'image-mcq':
      case 'video-mcq':
      case 'audio':
      case 'case-study':
      case 'combined':
      case 'table':
      case 'pdf':
      case 'passage':
      case 'chart':
        return <RadioMCQRenderer {...props} />;
      case 'checkbox':
        return <CheckboxRenderer {...props} />;
      case 'cross-out':
        return <CrossOutRenderer {...props} />;
      case 'highlight':
        return <HighlightRenderer {...props} />;
      case 'short-answer':
        return <ShortAnswerRenderer {...props} />;
      case 'fill-blank':
        return <FillBlankRenderer {...props} />;
      case 'matching':
        return <MatchingRenderer {...props} />;
      case 'anatomy':
        return <AnatomyRenderer {...props} />;
      case 'essay':
        return <EssayRenderer {...props} />;
      case 'word-highlight':
        return <WordHighlightRenderer {...props} />;
      case 'dropdown':
        return (
          <select
            value={selectedAnswer || ''}
            onChange={(e) => onSelectAnswer(question.id, e.target.value)}
            className="w-full p-[1em] rounded-xl border-2 text-[1em] exam-focus"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)'
            }}
            aria-label="Select your answer from the dropdown options">
            
            <option value="" disabled>
              Select an option...
            </option>
            {question.options?.map((opt, i) =>
            <option key={i} value={opt}>
                {opt}
              </option>
            )}
          </select>);

      default:
        return <p>Unsupported question type.</p>;
    }
  };
  const renderInlineTools = () => {
    return (
      <>
        {showKeyboard && needsKeyboard &&
        <VirtualKeyboard
          isOpen={true}
          onClose={onToggleKeyboard || (() => {})}
          inline={true} />

        }
      </>);

  };
  return (
    <div className="w-full flex-1 min-h-0 animate-card-enter flex flex-col overflow-hidden">

      {hasMedia ?
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden flex-col md:flex-row">

          {/* LEFT card — question stem + answers */}
          <div className="md:w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ zoom: zoomPercent / 100, padding: '2em', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {renderQuestionStem()}
              <div>
                <h3
                  className="font-semibold text-sm mb-4"
                  style={{ color: 'var(--muted-foreground)' }}>
                  Select your answer:
                </h3>
                {renderInteractive()}
              </div>
              {renderInlineTools()}
            </div>
          </div>

          {/* RIGHT column — reference panel or primary media */}
          <div className="md:w-1/2 min-h-[320px] md:min-h-0 flex flex-col gap-3">
            {hasRef ? (
              <QuestionReferencePanel references={question.references!} zoomPercent={zoomPercent} />
            ) : (
              <div
                className="flex-1 min-h-0 overflow-y-auto rounded-2xl border shadow-sm"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                <div style={{ zoom: zoomPercent / 100, padding: '2em', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {renderMediaOrContext()}
                </div>
              </div>
            )}
            {allowComments && (
              <QuestionCommentBox
                questionId={question.id}
                initialComment={comment}
                onSave={onCommentChange}
                isOpen={showReport}
                onClose={onCloseReport || (() => {})}
              />
            )}
          </div>
        </div> :

      <div className="flex-1 min-h-0 overflow-y-auto">
          <div
            className="max-w-4xl mx-auto rounded-2xl shadow-sm border"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <div style={{ zoom: zoomPercent / 100, padding: '2em', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {renderQuestionStem()}
              {renderInteractive()}
              {renderInlineTools()}
              {allowComments && (
                <QuestionCommentBox
                  questionId={question.id}
                  initialComment={comment}
                  onSave={onCommentChange}
                  isOpen={showReport}
                  onClose={onCloseReport || (() => {})}
                />
              )}
            </div>
          </div>
        </div>
      }
    </div>);

}