import { useEffect, useState, useRef } from 'react';
import { Question } from '../data/questions';
import { Tooltip } from './Tooltip';
import { QuestionCommentBox } from './QuestionCommentBox';
import { Button as DSButton, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Tabs, TabsList, TabsTrigger, TabsContent } from '@exxatdesignux/ui';

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
function buildPharmacologyPdf(): Blob {
  type Line = { text: string; bold?: boolean; size: number; indent?: number };
  const lines: Line[] = [
    { text: 'Beta-Adrenergic Antagonists -- Pharmacology Reference', bold: true, size: 14 },
    { text: '', size: 11 },
    { text: 'Compiled for NCLEX-RN / USMLE Step 1 review. For exam use only.', size: 11 },
    { text: '', size: 11 },
    { text: 'MECHANISM OF ACTION', bold: true, size: 11 },
    { text: 'Beta-blockers competitively antagonize catecholamines', size: 11 },
    { text: '(epinephrine, norepinephrine) at beta-adrenergic receptors,', size: 11 },
    { text: 'reducing heart rate, contractility, and AV conduction velocity.', size: 11 },
    { text: 'beta1-selective agents preferentially target cardiac receptors.', size: 11 },
    { text: '', size: 11 },
    { text: 'KEY CLINICAL INDICATIONS', bold: true, size: 11 },
    { text: '- Hypertension (first-line for young patients with tachycardia)', size: 11, indent: 10 },
    { text: '- Angina pectoris (reduces O2 demand by lowering HR and contractility)', size: 11, indent: 10 },
    { text: '- Post-MI cardioprotection (reduces reinfarction risk)', size: 11, indent: 10 },
    { text: '- Heart failure with reduced EF (metoprolol, carvedilol, bisoprolol)', size: 11, indent: 10 },
    { text: '- Atrial fibrillation / flutter (ventricular rate control)', size: 11, indent: 10 },
    { text: '- Essential tremor, performance anxiety (propranolol)', size: 11, indent: 10 },
    { text: '', size: 11 },
    { text: 'ABSOLUTE CONTRAINDICATIONS', bold: true, size: 11 },
    { text: '- Cardiogenic shock', size: 11, indent: 10 },
    { text: '- Decompensated heart failure', size: 11, indent: 10 },
    { text: '- 2nd/3rd-degree AV block (without pacemaker)', size: 11, indent: 10 },
    { text: '- Severe bradycardia (< 50 bpm)', size: 11, indent: 10 },
    { text: '', size: 11 },
    { text: 'NOTABLE ADVERSE EFFECTS', bold: true, size: 11 },
    { text: '- Bradycardia, hypotension', size: 11, indent: 10 },
    { text: '- Fatigue, cold extremities (peripheral vasoconstriction)', size: 11, indent: 10 },
    { text: '- Masking of hypoglycemia symptoms in diabetics', size: 11, indent: 10 },
    { text: '- Bronchoconstriction (non-selective -- avoid in asthma/COPD)', size: 11, indent: 10 },
    { text: '- Rebound hypertension on abrupt withdrawal', size: 11, indent: 10 },
  ];

  const streamParts: string[] = [];
  let y = 740;
  for (const { text, bold, size, indent = 0 } of lines) {
    if (!text) { y -= 10; continue; }
    const safe = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamParts.push(`BT ${bold ? '/FB' : '/F1'} ${size} Tf ${40 + indent} ${y} Td (${safe}) Tj ET`);
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
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Blob([body + xref], { type: 'application/pdf' });
}

function PdfRefPanel(_props: { url: string; label: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const blob = buildPharmacologyPdf();
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  if (!src) return (
    <div className="flex-1 flex items-center justify-center">
      <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: 24, color: 'var(--muted-foreground)' }} />
    </div>
  );

  return (
    <embed
      src={src}
      type="application/pdf"
      className="flex-1 w-full"
      style={{ border: 'none', minHeight: 340, display: 'block' }}
    />
  );
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
    if (ref.type === 'table') {
      return (
        <div className="flex flex-col gap-3">
          {ref.title && (
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{ref.title}</p>
          )}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {ref.headers.map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ref.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {ref.note && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ref.note}</p>
          )}
        </div>
      );
    }
    if (ref.type === 'html') {
      return (
        <div
          className="ref-html-content"
          dangerouslySetInnerHTML={{ __html: ref.url }}
          style={{ lineHeight: 1.7, color: 'var(--foreground)' }}
        />
      );
    }
    if (ref.type === 'pdf') {
      return <PdfRefPanel url={ref.url} label={ref.label} />;
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

  const typeIcon = (type: string) => {
    switch (type) {
      case 'image': return 'fa-image';
      case 'table': return 'fa-table';
      case 'pdf':   return 'fa-file-lines';
      case 'html':  return 'fa-code';
      default:      return 'fa-globe';
    }
  };

  return (
    <div
      className="flex-1 min-h-0 flex flex-col rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
      role="complementary"
      aria-label="Question reference material"
    >
      <div style={{ zoom: zoomPercent / 100, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {references.length > 1 ? (
          <Tabs defaultValue="0" className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 border-b border-border overflow-x-auto">
              <TabsList variant="line" className="w-max min-w-full">
                {references.map((ref, i) => (
                  <TabsTrigger key={i} value={String(i)}>
                    <i className={`fa-light ${typeIcon(ref.type)} fa-fw me-1.5`} aria-hidden="true" />
                    {ref.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {references.map((ref, i) => (
              <TabsContent
                key={i}
                value={String(i)}
                className="flex-1 overflow-auto p-[2em] flex flex-col gap-[0.625em] min-h-0"
              >
                {renderRef(ref)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: '2em', display: 'flex', flexDirection: 'column', gap: '0.625em', minHeight: 0 }}>
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
  <div>
      {/* Single row: number · title (flex-1, wraps) · icons */}
      <div className="flex items-start gap-2">
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
          className="flex flex-col overflow-hidden"
          style={{ minHeight: '300px' }}
        >
          <TabsList
            variant="line"
            className="w-full justify-start px-4 border-b border-border h-auto p-0 shrink-0"
          >
            {question.tabs.map((t, i) => (
              <TabsTrigger
                key={i}
                value={String(i)}
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
              className="flex-1 p-[2em] overflow-y-auto space-y-[1em] mt-0"
            >
              {tab.content.map((p, j) => (
                <p key={j} className="text-[0.875em] leading-relaxed" style={{ color: 'var(--foreground)' }}>
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
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
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
          color: 'var(--foreground)',
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
            color: 'var(--foreground)'
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
            color: 'var(--foreground)'
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
                {question.type === 'case-study' ? (
                  /* Case-study manages its own padding like the reference panel — no outer padding wrapper */
                  <div style={{ zoom: zoomPercent / 100, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {renderMediaOrContext()}
                  </div>
                ) : (
                  <div style={{ zoom: zoomPercent / 100, padding: '2em', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {renderMediaOrContext()}
                  </div>
                )}
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