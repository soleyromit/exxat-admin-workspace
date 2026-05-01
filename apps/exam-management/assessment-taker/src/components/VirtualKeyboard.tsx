import React, { useCallback, useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
export interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
  onKeyPress?: (key: string) => void;
}
export function VirtualKeyboard({
  isOpen,
  onClose,
  inline = false,
  onKeyPress
}: VirtualKeyboardProps) {
  const [isMac, setIsMac] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  if (!isOpen) return null;
  const keys = [
  [
  '`',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  '-',
  '=',
  'Backspace'],

  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  [
  isMac ? 'fn' : 'Ctrl',
  isMac ? 'Control' : 'Win',
  isMac ? 'Option' : 'Alt',
  'Space',
  isMac ? 'Command' : 'Alt',
  isMac ? 'Option' : 'Fn',
  'Ctrl']];


  const NON_CHAR_KEYS = [
  'Caps',
  'Ctrl',
  'Control',
  'Option',
  'Command',
  'Win',
  'Alt',
  'fn',
  'Fn'];

  const insertIntoActiveElement = (char: string) => {
    // Find the focused textarea/input or the last one marked as virtual keyboard target
    let target = document.activeElement as
    HTMLTextAreaElement |
    HTMLInputElement |
    null;
    if (
    !(
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement))

    {
      // Try to find a virtual keyboard target
      const targets = document.querySelectorAll(
        '[data-virtual-keyboard-target="true"]'
      );
      if (targets.length > 0) {
        target = targets[targets.length - 1] as
        HTMLTextAreaElement |
        HTMLInputElement;
        target.focus();
      }
    }
    if (
    !target ||
    !(
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement))

    {
      // Fallback to onKeyPress callback
      if (onKeyPress) onKeyPress(char);
      return;
    }
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const value = target.value;
    if (char === 'Backspace') {
      if (start !== end) {
        // Delete selection
        const newValue = value.slice(0, start) + value.slice(end);
        setNativeValue(target, newValue, start);
      } else if (start > 0) {
        const newValue = value.slice(0, start - 1) + value.slice(start);
        setNativeValue(target, newValue, start - 1);
      }
    } else {
      const insertChar = char === '\n' ? '\n' : char === '\t' ? '\t' : char;
      const newValue = value.slice(0, start) + insertChar + value.slice(end);
      setNativeValue(target, newValue, start + insertChar.length);
    }
  };
  const setNativeValue = (
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string,
  cursorPos: number) =>
  {
    // Use native input setter to trigger React's onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ?
      HTMLTextAreaElement.prototype :
      HTMLInputElement.prototype,
      'value'
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }
    // Dispatch input event so React picks it up
    el.dispatchEvent(
      new Event('input', {
        bubbles: true
      })
    );
    // Restore cursor position
    requestAnimationFrame(() => {
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };
  const handleKeyClick = (key: string) => {
    if (key === 'Shift') {
      setShiftActive(!shiftActive);
      return;
    }
    if (key === 'Caps') {
      setCapsLock(!capsLock);
      return;
    }
    if (NON_CHAR_KEYS.includes(key)) return;
    if (key === 'Space') {
      insertIntoActiveElement(' ');
    } else if (key === 'Backspace') {
      insertIntoActiveElement('Backspace');
    } else if (key === 'Enter') {
      insertIntoActiveElement('\n');
    } else if (key === 'Tab') {
      insertIntoActiveElement('\t');
    } else {
      const useUpper = shiftActive || capsLock;
      insertIntoActiveElement(useUpper ? key.toUpperCase() : key.toLowerCase());
      if (shiftActive) setShiftActive(false);
    }
  };
  const wrapperClass = inline ?
  'w-full mt-4 animate-card-enter' :
  'fixed bottom-20 left-0 right-0 mx-auto w-full max-w-4xl px-4 z-50 animate-slide-up flex justify-center';
  return (
    <div className={wrapperClass}>
      <div
        className="p-4 rounded-xl shadow-lg border w-full"
        style={{
          backgroundColor: 'var(--surface-white)',
          borderColor: 'var(--border-default)'
        }}>
        
        <div className="flex justify-between items-center mb-3 px-2">
          <span
            className="font-heading text-sm font-medium flex items-center gap-2"
            style={{
              color: 'var(--text-secondary)'
            }}>
            
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: '#22C55E'
              }} />
            
            {isMac ? 'macOS' : 'Windows'} Keyboard
            {capsLock &&
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{
                backgroundColor: 'var(--exam-accent-light)',
                color: 'var(--exam-accent)'
              }}>
              
                CAPS
              </span>
            }
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{
              color: 'var(--text-muted)'
            }}>
            
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {keys.map((row, i) =>
          <div
            key={i}
            className="flex justify-center gap-1 md:gap-1.5 w-full">
            
              {row.map((key, j) => {
              let flexClass = 'flex-1';
              if (
              ['Backspace', 'Tab', 'Caps', 'Enter', 'Shift'].includes(key))

              flexClass = 'flex-[1.5]';
              if (key === 'Space') flexClass = 'flex-[6]';
              if (key === 'Command') flexClass = 'flex-[1.2]';
              const isModifier = [
              'Shift',
              'Caps',
              'Ctrl',
              'Control',
              'Option',
              'Command',
              'Win',
              'Alt',
              'fn',
              'Fn'].
              includes(key);
              const isShiftKey = key === 'Shift';
              const isCapsKey = key === 'Caps';
              const isActive =
              isShiftKey && shiftActive || isCapsKey && capsLock;
              return (
                <button
                  key={j}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent stealing focus from textarea
                    handleKeyClick(key);
                  }}
                  className={`${flexClass} min-w-0 h-9 md:h-10 rounded-lg font-heading text-xs md:text-sm font-medium transition-colors flex items-center justify-center truncate px-1 active:scale-95`}
                  style={{
                    backgroundColor: isActive ?
                    'var(--exam-accent-light)' :
                    isModifier ?
                    'var(--surface-subtle)' :
                    'var(--surface-white)',
                    color: isActive ?
                    'var(--exam-accent)' :
                    'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}>
                  
                    {key}
                  </button>);

            })}
            </div>
          )}
        </div>
      </div>
    </div>);

}