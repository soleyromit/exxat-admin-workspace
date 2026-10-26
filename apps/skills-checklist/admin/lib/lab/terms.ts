/**
 * The program's noun for what a student gets signed off on. One place, so a program that says "competency" or
 * "procedure" changes one value. Lab copy never uses the word "items".
 *
 * The value is set in Settings > Naming (CALL 10-26 item 7) and kept in localStorage (key TERMS_KEY), so it survives reloads and
 * is shared by every tab (another tab's change arrives through the storage event). Blocked storage keeps it in memory for the page. This module stays free of React so server code (personas, registry) can
 * import it; the client hook that re-renders on a change is `useTerms` in components/lab/library/use-terms.ts.
 *
 * Hydration: the server always renders the default noun. The stored noun is read only when a client calls
 * `loadStoredTerms()` after mount (the hook does this), so the first client render matches the server.
 */
export interface Terms {
  skillNoun: string
  skillNounPlural: string
}

export const DEFAULT_TERMS: Terms = { skillNoun: "skill", skillNounPlural: "skills" }
export const TERMS_KEY = "lab:terms"

let current: Terms = DEFAULT_TERMS
let loaded = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const skillNoun = (): string => current.skillNoun
export const skillNounPlural = (): string => current.skillNounPlural
export const getTerms = (): Terms => current

/** Blank or missing parts fall back to the default, so a half-filled value never renders as an empty word. */
function clean(t: Partial<Terms>): Terms {
  const one = (t.skillNoun ?? "").trim()
  const many = (t.skillNounPlural ?? "").trim()
  return { skillNoun: one || DEFAULT_TERMS.skillNoun, skillNounPlural: many || DEFAULT_TERMS.skillNounPlural }
}

const same = (a: Terms, b: Terms) => a.skillNoun === b.skillNoun && a.skillNounPlural === b.skillNounPlural

/** localStorage, or null on the server or when the browser blocks it. */
function store(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The stored noun, or the default. Never throws. */
function readStored(): Terms {
  try {
    const raw = store()?.getItem(TERMS_KEY)
    return raw ? clean(JSON.parse(raw) as Partial<Terms>) : DEFAULT_TERMS
  } catch {
    return DEFAULT_TERMS
  }
}

/** Sets the noun for every screen, keeps it in localStorage (browser only) and tells subscribed screens to re-render. */
export const setTerms = (t: Partial<Terms>): void => {
  const next = clean(t)
  loaded = true
  try {
    const st = store()
    if (same(next, DEFAULT_TERMS)) st?.removeItem(TERMS_KEY)
    else st?.setItem(TERMS_KEY, JSON.stringify(next))
  } catch {
    /* storage blocked or full: the noun lasts until reload */
  }
  if (same(next, current)) return
  current = next
  emit()
}

export const resetTerms = (): void => setTerms(DEFAULT_TERMS)

let watching = false

/** Reads the saved noun, once, and follows changes made in other tabs. Call after mount only (see the hydration note above). */
export function loadStoredTerms(): void {
  if (loaded || typeof window === "undefined") return
  loaded = true
  if (!watching) {
    watching = true
    window.addEventListener("storage", (e) => {
      if (e.key !== TERMS_KEY && e.key !== null) return
      const next = readStored()
      if (same(next, current)) return
      current = next
      emit()
    })
  }
  const next = readStored()
  if (same(next, current)) return
  current = next
  emit()
}

/** Test seam: forget what was read, so the next loadStoredTerms() reads storage again (a reload in one call). */
export function forgetLoadedTerms(): void {
  loaded = false
  current = DEFAULT_TERMS
}

export function subscribeTerms(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * "a skill", "a competency", "an EPA", "an outcome". A program's own noun can need "an"; screens that hard-code "a " read
 * wrong for those nouns. All-caps acronyms go by the sound of their first letter (EPA, "ee-pee-ay").
 */
export function aNoun(noun: string = skillNoun()): string {
  const w = noun.trim()
  const acronym = w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)
  const an = acronym ? /^[AEFHILMNORSX]/.test(w) : /^[aeiou]/i.test(w) && !/^(uni|use|usu|eu|one)/i.test(w)
  return `${an ? "an" : "a"} ${w}`
}

/**
 * Rewrites a fixed label written with the default noun ("Add a skill", "Skills library", "Skill detail") in the program's
 * noun, keeping the article and the capital: "Add an EPA", "Competencies library", "Competency detail". For text that
 * cannot call skillNoun() itself: registry titles (breadcrumb) and the present-mode list. Unchanged on the default noun.
 */
export function withNoun(text: string, t: Terms = current): string {
  if (same(t, DEFAULT_TERMS)) return text
  const like = (word: string, out: string) => (word.charAt(0) === word.charAt(0).toUpperCase() ? capitalize(out) : out)
  return text
    .replace(/\b([Aa])n? skill\b/g, (_m, art: string) => (art === "A" ? capitalize(aNoun(t.skillNoun)) : aNoun(t.skillNoun)))
    .replace(/\b[Ss]kills\b/g, (w) => like(w, t.skillNounPlural))
    .replace(/\b[Ss]kill\b/g, (w) => like(w, t.skillNoun))
}

/** "1 skill", "12 skills". */
export const countSkills = (n: number): string => `${n.toLocaleString("en-US")} ${n === 1 ? skillNoun() : skillNounPlural()}`
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
