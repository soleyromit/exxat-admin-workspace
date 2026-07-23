"use client"

import * as React from "react"
import { useLocation } from "react-router-dom"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { isEditableTarget } from "@/lib/editable-target"
import { isExamLockPath } from "@/lib/exam-lock-shell"
import { productSlug } from "@/stores/app-store"
import { useProduct } from "@/contexts/product-context"

/**
 * Page context that pages register with `useAskLeoPageContext` so Leo knows
 * what the user is currently looking at.
 */
export interface AskLeoPageContext {
  title: string
  description?: string
  suggestions?: string[]
  data?: Record<string, unknown>
}

interface AskLeoContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  openWithPrompt: (prompt: string) => void
  consumePendingComposerPrompt: () => string | null
  pageContext: AskLeoPageContext | null
  setPageContext: (ctx: AskLeoPageContext | null) => void
}

const AskLeoContext = React.createContext<AskLeoContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  openWithPrompt: () => {},
  consumePendingComposerPrompt: () => null,
  pageContext: null,
  setPageContext: () => {},
})

function isLeoLandingPath(pathname: string, leoHref: string) {
  return pathname === leoHref || pathname.startsWith(`${leoHref}/`)
}

export function useAskLeo() {
  return React.useContext(AskLeoContext)
}

export function useAskLeoPageContext(ctx: AskLeoPageContext | null) {
  const { setPageContext } = React.useContext(AskLeoContext)
  React.useEffect(() => {
    setPageContext(ctx)
    return () => setPageContext(null)
  }, [ctx, setPageContext])
}

export function AskLeoProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const examLock = isExamLockPath(pathname)
  const [open, setOpen] = React.useState(false)
  const [pageContext, setPageContext] = React.useState<AskLeoPageContext | null>(null)
  const toggle = React.useCallback(() => setOpen(v => !v), [])
  const pendingComposerPromptRef = React.useRef<string | null>(null)

  const openWithPrompt = React.useCallback((prompt: string) => {
    pendingComposerPromptRef.current = prompt
    setOpen(true)
  }, [])

  const consumePendingComposerPrompt = React.useCallback(() => {
    const prompt = pendingComposerPromptRef.current
    pendingComposerPromptRef.current = null
    return prompt
  }, [])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      openWithPrompt,
      consumePendingComposerPrompt,
      pageContext,
      setPageContext,
    }),
    [open, toggle, openWithPrompt, consumePendingComposerPrompt, pageContext],
  )

  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`

  React.useEffect(() => {
    if (isLeoLandingPath(pathname, leoHref)) {
      setOpen(false)
    }
  }, [pathname, leoHref])

  const toggleRef = React.useRef(toggle)
  toggleRef.current = toggle

  React.useEffect(() => {
    if (examLock) {
      setOpen(false)
      return
    }
    function onGlobalKeyDown(event: KeyboardEvent) {
      if (!event.altKey || (!event.metaKey && !event.ctrlKey)) return
      if (event.key.toLowerCase() !== "k") return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      toggleRef.current()
    }
    document.addEventListener("keydown", onGlobalKeyDown)
    return () => document.removeEventListener("keydown", onGlobalKeyDown)
  }, [examLock])

  return (
    <AskLeoContext.Provider value={value}>
      {children}
    </AskLeoContext.Provider>
  )
}

export function AskLeoShortcutKbds({
  className,
  variant = "tile",
}: {
  className?: string
  variant?: "tile" | "bare"
}) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  if (variant === "bare") {
    return (
      <KbdGroup className={className}>
        <Kbd variant="bare">{mod}{alt}K</Kbd>
      </KbdGroup>
    )
  }
  return (
    <KbdGroup className={className}>
      <Kbd>{mod}</Kbd>
      <Kbd>{alt}</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  )
}
