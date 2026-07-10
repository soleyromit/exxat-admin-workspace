import { useState } from 'react';
import { Button as DSButton } from '@exxatdesignux/ui';

export interface CalculatorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

export function CalculatorPopover({ isOpen, onClose, inline = false }: CalculatorPopoverProps) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [mode, setMode] = useState<'standard' | 'scientific'>('standard');

  if (!isOpen) return null;

  const handleNum = (n: string) => {
    if (waitingForOperand) {
      setDisplay(n);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '÷': return b !== 0 ? a / b : 0;
      case '×': return a * b;
      case '-': return a - b;
      case '+': return a + b;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (prevValue !== null && operator) {
      const current = parseFloat(display);
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleToggleSign = () => setDisplay(String(-parseFloat(display)));
  const handlePercent = () => setDisplay(String(parseFloat(display) / 100));

  const handleScientific = (fn: string) => {
    const val = parseFloat(display);
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const fmt = (n: number) => String(parseFloat(n.toPrecision(10)));

    if (fn === 'π') { setDisplay(String(Math.PI)); setWaitingForOperand(false); return; }
    if (fn === 'e')  { setDisplay(String(Math.E));  setWaitingForOperand(false); return; }
    if (fn === 'xʸ') { handleOperator('^'); return; }

    let result: number;
    switch (fn) {
      case 'sin': result = Math.sin(toRad(val)); break;
      case 'cos': result = Math.cos(toRad(val)); break;
      case 'tan': result = Math.tan(toRad(val)); break;
      case 'log': result = Math.log10(val); break;
      case 'ln':  result = Math.log(val); break;
      case '√':   result = Math.sqrt(val); break;
      case 'x²':  result = val * val; break;
      case '1/x': result = val !== 0 ? 1 / val : 0; break;
      case '|x|': result = Math.abs(val); break;
      default: return;
    }
    setDisplay(fmt(result));
    setWaitingForOperand(true);
  };

  const handleButton = (btn: string) => {
    if (btn === 'C')  return handleClear();
    if (btn === '±')  return handleToggleSign();
    if (btn === '%')  return handlePercent();
    if (btn === '.')  return handleDecimal();
    if (btn === '=')  return handleEquals();
    if (['÷', '×', '-', '+'].includes(btn)) return handleOperator(btn);
    handleNum(btn);
  };

  const SCIENTIFIC_BTNS = ['sin', 'cos', 'tan', 'π', 'log', 'ln', '√', 'e', 'x²', 'xʸ', '1/x', '|x|'];
  const STANDARD_BTNS   = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];

  const SCIENTIFIC_LABELS: Record<string, string> = {
    'sin': 'sine',
    'cos': 'cosine',
    'tan': 'tangent',
    'π':   'pi',
    'log': 'log base 10',
    'ln':  'natural log',
    '√':   'square root',
    'e':   "Euler's number",
    'x²':  'x squared',
    'xʸ':  'x to the power of y',
    '1/x': 'reciprocal',
    '|x|': 'absolute value',
  };

  const standardLabel = (btn: string): string => {
    const map: Record<string, string> = {
      'C': 'clear',
      '±': 'toggle sign',
      '%': 'percent',
      '÷': 'divide',
      '×': 'multiply',
      '-': 'subtract',
      '+': 'add',
      '=': 'equals',
      '.': 'decimal point',
    };
    return map[btn] ?? btn;
  };

  const wrapperClass = inline ? 'w-full mt-4 animate-card-enter' : 'fixed top-20 right-20 z-50 animate-pop-in';

  return (
    <div className={wrapperClass} style={inline ? {} : { width: '300px' }}>
      <div
        className="shadow-lg rounded-2xl overflow-hidden border"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', maxWidth: inline ? '320px' : undefined }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-3 py-2 border-b"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Mode toggle */}
          <div
            className="flex items-center rounded-md p-0.5"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {(['standard', 'scientific'] as const).map(m => (
              <DSButton
                key={m}
                onClick={() => setMode(m)}
                variant="ghost"
                size="xs"
                className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                style={
                  mode === m
                    ? { backgroundColor: 'var(--card)', color: 'var(--foreground)' }
                    : { color: 'var(--muted-foreground)' }
                }
                aria-pressed={mode === m}
              >
                {m === 'standard' ? 'Standard' : 'Scientific'}
              </DSButton>
            ))}
          </div>

          <DSButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close calculator">
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 16 }} />
          </DSButton>
        </div>

        <div className="p-3" style={{ backgroundColor: 'var(--card)' }}>
          {/* Display */}
          <div
            className="w-full px-3 py-2 text-right font-mono rounded-lg mb-3 overflow-hidden"
            style={{
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              fontSize: display.length > 10 ? 20 : 28,
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {display}
          </div>

          {/* Scientific buttons */}
          {mode === 'scientific' && (
            <div
              className="grid grid-cols-4 gap-1.5 mb-2 pb-2 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              {SCIENTIFIC_BTNS.map(btn => (
                <button
                  key={btn}
                  aria-label={SCIENTIFIC_LABELS[btn] ?? btn}
                  onClick={() => handleScientific(btn)}
                  className="h-9 rounded-lg text-[12px] font-medium transition-colors active:scale-95"
                  style={{
                    backgroundColor: 'var(--muted)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          )}

          {/* Standard buttons */}
          <div className="grid grid-cols-4 gap-2">
            {STANDARD_BTNS.map((btn, i) => {
              const isOp     = ['÷', '×', '-', '+'].includes(btn);
              const isEquals = btn === '=';
              const isZero   = btn === '0';
              return (
                <button
                  key={i}
                  aria-label={standardLabel(btn)}
                  onClick={() => handleButton(btn)}
                  className={`h-12 rounded-lg text-lg font-medium transition-colors active:scale-95 ${isZero ? 'col-span-2' : ''}`}
                  style={{
                    backgroundColor: isEquals ? 'var(--brand-color)' : isOp ? 'var(--muted)' : 'var(--card)',
                    color: isEquals ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
