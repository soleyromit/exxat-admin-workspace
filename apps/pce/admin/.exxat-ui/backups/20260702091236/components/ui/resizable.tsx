'use client'
// Stub — react-resizable-panels not installed in PCE admin.
// Satisfies sync-extras template imports without adding the dependency.
import * as React from 'react'
export function ResizablePanelGroup({ children, className }: { children?: React.ReactNode; className?: string; direction?: string }) { return <div className={className}>{children}</div> }
export function ResizablePanel({ children, className }: { children?: React.ReactNode; className?: string; defaultSize?: number }) { return <div className={className}>{children}</div> }
export function ResizableHandle({ className }: { className?: string; withHandle?: boolean }) { return <div className={className} /> }
