"use client"

import * as React from "react"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  type AttachmentState,
} from "@/components/ui/attachment"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function FileIcon({ kind }: { kind?: "pdf" | "code" | "zip" | "sheet" | "image" | "generic" }) {
  const cls =
    kind === "pdf"
      ? "fa-light fa-file-pdf"
      : kind === "code"
        ? "fa-light fa-file-code"
        : kind === "zip"
          ? "fa-light fa-file-zipper"
          : kind === "sheet"
            ? "fa-light fa-file-spreadsheet"
            : kind === "image"
              ? "fa-light fa-image"
              : "fa-light fa-file"
  return <i className={cls} aria-hidden="true" />
}

function RemoveAction({ name }: { name: string }) {
  return (
    <AttachmentAction aria-label={`Remove ${name}`}>
      <i className="fa-light fa-xmark" aria-hidden="true" />
    </AttachmentAction>
  )
}

export function AttachmentBasicPreview() {
  return (
    <div className="flex flex-wrap gap-3">
      <Attachment>
        <AttachmentMedia>
          <FileIcon kind="pdf" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
          <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <RemoveAction name="sales-dashboard.pdf" />
        </AttachmentActions>
      </Attachment>
      <Attachment>
        <AttachmentMedia>
          <FileIcon kind="code" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>message-renderer.tsx</AttachmentTitle>
          <AttachmentDescription>TypeScript · 12 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <RemoveAction name="message-renderer.tsx" />
        </AttachmentActions>
      </Attachment>
    </div>
  )
}

const STATE_ROWS: {
  state: AttachmentState
  title: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    state: "idle",
    title: "selected-file.pdf",
    description: "Ready to upload",
    icon: <i className="fa-light fa-clock" aria-hidden="true" />,
  },
  {
    state: "uploading",
    title: "design-system.zip",
    description: "Uploading · 64%",
    icon: <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />,
  },
  {
    state: "processing",
    title: "market-research.pdf",
    description: "Processing document",
    icon: <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />,
  },
  {
    state: "error",
    title: "financial-model.numbers",
    description: "Upload failed. Try again.",
    icon: <i className="fa-light fa-circle-exclamation" aria-hidden="true" />,
  },
  {
    state: "done",
    title: "uploaded-report.pdf",
    description: "Uploaded · 1.8 MB",
    icon: <i className="fa-light fa-circle-check" aria-hidden="true" />,
  },
]

export function AttachmentStatesPreview() {
  return (
    <div className="flex flex-col gap-3">
      {STATE_ROWS.map(row => (
        <Attachment key={row.state} state={row.state}>
          <AttachmentMedia>{row.icon}</AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{row.title}</AttachmentTitle>
            <AttachmentDescription>{row.description}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name={row.title} />
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  )
}

export function AttachmentImagePreview() {
  return (
    <AttachmentGroup>
      {[
        { name: "workspace.png", meta: "PNG · 820 KB", src: "https://picsum.photos/seed/exxat-a/240/240" },
        { name: "desk-reference.jpg", meta: "JPG · 1.1 MB", src: "https://picsum.photos/seed/exxat-b/240/240" },
        { name: "office-reference.jpg", meta: "JPG · 940 KB", src: "https://picsum.photos/seed/exxat-c/240/240" },
      ].map(item => (
        <Attachment key={item.name} orientation="vertical">
          <AttachmentMedia variant="image">
            <img src={item.src} alt="" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
            <AttachmentDescription>{item.meta}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name={item.name} />
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

/** Document files using `AttachmentMedia variant="image"` for page/thumbnail previews. */
export function AttachmentDocumentImagePreview() {
  return (
    <div className="flex flex-col gap-4">
      <AttachmentGroup aria-label="Document image attachments" role="group" tabIndex={0}>
        {[
          {
            name: "placement-handbook.pdf",
            meta: "PDF · 2.1 MB",
            src: "https://picsum.photos/seed/exxat-doc-a/240/240",
          },
          {
            name: "compliance-checklist.pdf",
            meta: "PDF · 640 KB",
            src: "https://picsum.photos/seed/exxat-doc-b/240/240",
          },
          {
            name: "site-agreement.docx",
            meta: "DOCX · 180 KB",
            src: "https://picsum.photos/seed/exxat-doc-c/240/240",
          },
        ].map(item => (
          <Attachment key={item.name} orientation="vertical">
            <AttachmentMedia variant="image">
              <img src={item.src} alt="" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{item.name}</AttachmentTitle>
              <AttachmentDescription>{item.meta}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <RemoveAction name={item.name} />
            </AttachmentActions>
          </Attachment>
        ))}
      </AttachmentGroup>

      <div className="flex flex-wrap gap-3">
        <Attachment>
          <AttachmentMedia variant="image">
            <img src="https://picsum.photos/seed/exxat-doc-h/96/96" alt="" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>rotation-schedule.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 410 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name="rotation-schedule.pdf" />
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia variant="image">
            <img src="https://picsum.photos/seed/exxat-doc-u/96/96" alt="" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>background-check.pdf</AttachmentTitle>
            <AttachmentDescription>Uploading · 42%</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name="background-check.pdf" />
          </AttachmentActions>
        </Attachment>
      </div>
    </div>
  )
}

export function AttachmentSizesPreview() {
  return (
    <div className="flex flex-col gap-3">
      {(["default", "sm", "xs"] as const).map(size => (
        <Attachment key={size} size={size}>
          <AttachmentMedia>
            <FileIcon kind="pdf" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {size === "default" ? "Default" : size === "sm" ? "Small" : "Extra small"} attachment
            </AttachmentTitle>
            {size !== "xs" ? (
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            ) : null}
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name={`${size} attachment`} />
          </AttachmentActions>
        </Attachment>
      ))}
    </div>
  )
}

const GROUP_ITEMS = [
  { name: "briefing-notes.pdf", meta: "PDF · 1.4 MB", kind: "pdf" as const },
  { name: "workspace.png", meta: "PNG · 820 KB", kind: "image" as const },
  { name: "customers.numbers", meta: "Sheet · 18 KB", kind: "sheet" as const },
  { name: "renderer.tsx", meta: "TSX · 12 KB", kind: "code" as const },
]

export function AttachmentGroupPreview() {
  return (
    <AttachmentGroup role="group" aria-label="Attached files" tabIndex={0}>
      {GROUP_ITEMS.map(item => (
        <Attachment key={item.name}>
          <AttachmentMedia>
            <FileIcon kind={item.kind} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
            <AttachmentDescription>{item.meta}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <RemoveAction name={item.name} />
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

export function AttachmentTriggerPreview() {
  return (
    <Dialog>
      <Attachment>
        <AttachmentMedia>
          <FileIcon kind="pdf" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>research-summary.pdf</AttachmentTitle>
          <AttachmentDescription>Open preview dialog</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Copy research-summary.pdf name">
            <i className="fa-light fa-copy" aria-hidden="true" />
          </AttachmentAction>
          <RemoveAction name="research-summary.pdf" />
        </AttachmentActions>
        <DialogTrigger asChild>
          <AttachmentTrigger aria-label="Preview research-summary.pdf" />
        </DialogTrigger>
      </Attachment>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>research-summary.pdf</DialogTitle>
          <DialogDescription>
            Preview chrome for an attachment trigger. Actions stay independently clickable.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
