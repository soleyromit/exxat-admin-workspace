// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Navigation user (minimal shim)
//
// The DS template's full lib/mock/navigation.tsx pulls in logo-dev, stock-portrait
// and question-bank-nav. PCE only consumes NAV_USER (avatar + name) in the Ask Leo
// sidebar, so this shim exposes just that to avoid porting the unused chain.
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_USER = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar: "",
}
