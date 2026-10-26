/**
 * The program's noun for what a student gets signed off on. One place, so a program that says "competency" or
 * "procedure" changes one value. Lab copy never uses the word "items".
 *
 * The value is set in Settings > Naming (CALL 10-26 item 7) and kept in the lab session (sessionStorage, key TERMS_KEY), so
 * it survives moving between screens and variants. This module stays free of React so server code (personas, registry) can
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

/** Sets the noun for every screen, keeps it in the lab session (browser only) and tells subscribed screens to re-render. */
export const setTerms = (t: Partial<Terms>): void => {
  const next = clean(t)
  loaded = true
  if (typeof window !== "undefined") {
    try {
      if (same(next, DEFAULT_TERMS)) window.sessionStorage.removeItem(TERMS_KEY)
      else window.sessionStorage.setItem(TERMS_KEY, JSON.stringify(next))
    } catch {
      /* storage blocked: the noun lasts until reload */
    }
  }
  if (same(next, current)) return
  current = next
  emit()
}

export const resetTerms = (): void => setTerms(DEFAULT_TERMS)

/** Reads the noun saved in this lab session, once. Call after mount only (see the hydration note above). */
export function loadStoredTerms(): void {
  if (loaded || typeof window === "undefined") return
  loaded = true
  let next = DEFAULT_TERMS
  try {
    const raw = window.sessionStorage.getItem(TERMS_KEY)
    if (raw) next = clean(JSON.parse(raw) as Partial<Terms>)
  } catch {
    next = DEFAULT_TERMS
  }
  if (same(next, current)) return
  current = next
  emit()
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
