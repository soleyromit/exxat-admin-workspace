"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import { cn } from "@/components/ui/utils";

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

function ToolbarButton({
  onClick,
  isActive,
  "aria-label": ariaLabel,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  "aria-label": string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 rounded-md",
        isActive && "bg-muted text-foreground"
      )}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
  minHeight = "160px",
  id,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [activeFormat, setActiveFormat] = React.useState({
    bold: false,
    italic: false,
    ul: false,
    ol: false,
  });
  const isInternalUpdate = React.useRef(false);

  const exec = React.useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const updateActiveFormat = React.useCallback(() => {
    setActiveFormat({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  const checkEmpty = React.useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML?.trim() || "";
    const empty = !html || html === "<br>" || html === "<br/>" || html === "<p></p>";
    el.setAttribute("data-placeholder", empty ? placeholder : "");
    el.classList.toggle("is-empty", empty);
  }, [placeholder]);

  const handleInput = React.useCallback(() => {
    if (isInternalUpdate.current) return;
    const html = editorRef.current?.innerHTML ?? "";
    onChange?.(html);
    checkEmpty();
    updateActiveFormat();
  }, [onChange, checkEmpty, updateActiveFormat]);

  React.useEffect(() => {
    if (!editorRef.current) return;
    const v = value?.trim() || "";
    const hasFocus = document.activeElement === editorRef.current;
    if (!hasFocus || v === "") {
      isInternalUpdate.current = true;
      editorRef.current.innerHTML = v || "";
      if (!v) {
        editorRef.current.setAttribute("data-placeholder", placeholder);
      } else {
        editorRef.current.removeAttribute("data-placeholder");
      }
      isInternalUpdate.current = false;
    }
  }, [value, placeholder]);

  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onSelectionChange = () => {
      requestAnimationFrame(updateActiveFormat);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [updateActiveFormat]);

  React.useEffect(() => {
    checkEmpty();
  }, [value, checkEmpty]);

  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const observer = new MutationObserver(checkEmpty);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [checkEmpty]);

  return (
    <div
      id={id}
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col rounded-md border border-[var(--control-border)] bg-background overflow-hidden",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-0",
        "transition-[color,box-shadow]",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div
        className="flex w-full min-w-0 items-center gap-0.5 border-b border-[var(--control-border)] px-2 py-1.5 rounded-t-md bg-muted/30"
        role="toolbar"
        aria-label="Text formatting"
      >
        <ToolbarButton
          onClick={() => exec("bold")}
          isActive={activeFormat.bold}
          aria-label="Bold"
        >
          <FontAwesomeIcon name="bold" className="h-4 w-4" weight="solid" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("italic")}
          isActive={activeFormat.italic}
          aria-label="Italic"
        >
          <FontAwesomeIcon name="italic" className="h-4 w-4" weight="solid" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("insertUnorderedList")}
          isActive={activeFormat.ul}
          aria-label="Bullet list"
        >
          <FontAwesomeIcon name="listUl" className="h-4 w-4" weight="solid" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("insertOrderedList")}
          isActive={activeFormat.ol}
          aria-label="Numbered list"
        >
          <FontAwesomeIcon name="listOl" className="h-4 w-4" weight="solid" />
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className={cn(
          "block min-w-0 w-full max-w-full px-3 py-2 text-base outline-none focus:outline-none md:text-sm",
          "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
          "prose prose-sm max-w-none [&_p]:my-0 [&_p]:whitespace-pre-wrap [&_p]:break-words [&_div]:whitespace-pre-wrap [&_div]:break-words [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5"
        )}
        style={{ minHeight }}
        role="textbox"
        aria-placeholder={placeholder}
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
      <style>{`
        [contenteditable].is-empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  );
}
