import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
import { QuestionCommentBox } from './QuestionCommentBox';
import { Button as DSButton } from '@exxat/ds/packages/ui/src';
function TabScrollContainer({
  children,
  style



}: {children: React.ReactNode;style?: React.CSSProperties;}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);
  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 4);
    setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener('scroll', updateFades, {
      passive: true
    });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateFades);
      ro.disconnect();
    };
  }, [updateFades]);
  return (
    <div
      className={`tab-scroll-container shrink-0 ${fadeLeft ? 'fade-left' : ''} ${fadeRight ? 'fade-right' : ''}`}
      style={style}>
      
      <div
        ref={scrollRef}
        className="tab-scroll-hide flex overflow-x-auto"
        role="tablist">
        
        {children}
      </div>
    </div>);

}
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
// ─── Per-question reference panel ────────────────────────────────────────────
function QuestionReferencePanel({
  references,
  onClose,
}: {
  references: NonNullable<Question['references']>;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = references[activeIdx];

  return (
    <div
      style={{
        position: 'fixed',
        top: 57,        // just below the 56px toolbar
        right: 0,
        bottom: 56,     // just above the sticky footer
        width: 'min(380px, 42vw)',
        zIndex: 30,
        backgroundColor: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-6px 0 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="complementary"
      aria-label="Question reference material"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
          Reference Material
        </span>
        <DSButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close reference panel">
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 15 }} />
        </DSButton>
      </div>

      {/* Tabs — only when multiple references */}
      {references.length > 1 && (
        <div
          style={{
            display: 'flex', flexShrink: 0,
            backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)',
          }}
        >
          {references.map((ref, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: activeIdx === i ? 700 : 500,
                color: activeIdx === i ? 'var(--foreground)' : 'var(--muted-foreground)',
                borderBottom: activeIdx === i ? '2px solid var(--foreground)' : '2px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
              role="tab"
              aria-selected={activeIdx === i}
            >
              {ref.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {references.length === 1 && (
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>
            {current.label}
          </p>
        )}

        {current.type === 'image' ? (
          <img
            src={current.url}
            alt={current.label}
            style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <iframe
              src={current.url}
              title={current.label}
              style={{ flex: 1, border: 'none', borderRadius: 8, minHeight: 360, width: '100%' }}
            />
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12, color: 'var(--exam-accent)', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
              Open in new tab
            </a>
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
  const [activeTab, setActiveTab] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [showRefPanel, setShowRefPanel] = useState(false);
  const pdfTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setActiveTab(0);
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
  const hasMedia =
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

        {/* Reference + Bookmark buttons — right-aligned, top-anchored */}
        <div className="flex items-center gap-0.5 shrink-0">
          {question.references?.length ? (
            <Tooltip content={showRefPanel ? 'Close reference' : 'View reference material'} position="bottom">
              <DSButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowRefPanel(v => !v)}
                aria-label={showRefPanel ? 'Close reference material' : 'Open reference material'}
                aria-expanded={showRefPanel}
                style={showRefPanel ? {
                  backgroundColor: 'var(--exam-accent-light)',
                  color: 'var(--exam-accent)',
                } : { color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-book-open" aria-hidden="true" style={{ fontSize: '1em' }} />
              </DSButton>
            </Tooltip>
          ) : null}
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
      </div>
    </div>;

  /**
   * Renders ONLY the media/context portion — NO answer choices.
   * Answer choices are rendered separately via renderInteractive().
   */
  const renderMediaOrContext = () => {
    let content = null;
    if (question.type === 'case-study' && question.tabs) {
      content =
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)',
          minHeight: '300px'
        }}>
        
          {/* Tab bar — hidden scrollbar with gradient fade masks */}
          <TabScrollContainer
          style={{
            backgroundColor: 'var(--muted)',
            borderBottom: '1px solid var(--border)'
          }}>
          
            {question.tabs.map((t, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="relative px-4 py-2.5 text-[0.875em] font-semibold transition-colors whitespace-nowrap shrink-0"
                style={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  backgroundColor: isActive ? 'var(--card)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer'
                }}
                role="tab"
                aria-selected={isActive}
                aria-label={`View ${t.title} tab`}>
                
                  {t.title}
                </button>);

          })}
          </TabScrollContainer>
          {/* Tab content */}
          <div
          className="p-[1.5em] space-y-[1em] overflow-y-auto flex-1"
          role="tabpanel">
          
            {question.tabs[activeTab]?.content.map((p, i) =>
          <p
            key={i}
            className="text-[0.875em] leading-relaxed"
            style={{
              color: 'var(--muted-foreground)'
            }}>
            
                {p}
              </p>
          )}
          </div>
          {/* Show image if case study also has an image */}
          {question.imageUrl &&
        <div
          className="p-[1em] border-t"
          style={{
            borderColor: 'var(--border)'
          }}>
          
              <ImagePanel
            src={question.imageUrl}
            alt="Case study reference image" />
          
            </div>
        }
        </div>;

    } else if (question.imageUrl) {
      content =
      <ImagePanel src={question.imageUrl} alt="Question reference image" />;

    } else if (question.videoUrl) {
      content =
      <div
        className="rounded-xl overflow-hidden border flex flex-col"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: '#000000',
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
      <div
        className="overflow-x-auto rounded-xl border"
        style={{
          borderColor: 'var(--border)'
        }}>
        
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
              style={{
                backgroundColor: 'var(--muted)'
              }}>
              
                {question.tableData.headers.map((h, i) =>
              <th
                key={i}
                className="p-[1em] font-bold text-[0.875em] border-b"
                style={{
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)'
                }}>
                
                    {h}
                  </th>
              )}
              </tr>
            </thead>
            <tbody>
              {question.tableData.rows.map((row, i) =>
            <tr
              key={i}
              className="border-b last:border-0"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--card)'
              }}>
              
                  {row.map((cell, j) =>
              <td
                key={j}
                className="p-[1em] text-[0.875em]"
                style={{
                  color: 'var(--muted-foreground)'
                }}>
                
                      {cell}
                    </td>
              )}
                </tr>
            )}
            </tbody>
          </table>
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
    <div
      className="w-full flex-1 min-h-0 animate-card-enter flex flex-col overflow-hidden"
      style={{
        fontSize: `${zoomPercent}%`
      }}>
      
      {hasMedia ?
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden flex-row">
          {/* LEFT card */}
          <div className="w-1/2 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em] flex flex-col gap-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            {renderQuestionStem()}
            <div>
              <h3
                className="font-semibold text-[1em] mb-4"
                style={{ color: 'var(--muted-foreground)' }}>
                Select your answer:
              </h3>
              {renderInteractive()}
            </div>
            {renderInlineTools()}
          </div>

          {/* RIGHT card + report below */}
          <div className="w-1/2 min-h-0 flex flex-col gap-3">
            <div
              className="flex-1 min-h-0 overflow-y-auto rounded-2xl border shadow-sm p-[2em] flex flex-col gap-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
              <p className="text-[0.75em] font-bold" style={{ color: 'var(--muted-foreground)' }}>
                Reference Material
              </p>
              {renderMediaOrContext()}
            </div>
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
          className="max-w-4xl mx-auto rounded-2xl p-[2em] shadow-sm border flex flex-col gap-4"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)'
          }}>
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
      }

      {showRefPanel && question.references?.length ? (
        <QuestionReferencePanel
          references={question.references}
          onClose={() => setShowRefPanel(false)}
        />
      ) : null}
    </div>);

}