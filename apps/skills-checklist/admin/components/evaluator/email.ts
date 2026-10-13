// S-18 Evaluation-request email: a PURE template function. It does not send anything and chooses no mail provider,
// sender domain or library (contract §9: those are open questions for the platform owner). Copy: docs/ux/09 §5 S-18.
//
// Hard rules from the contract:
//  - one email per request, all skills listed, one link (EV-05)
//  - states that no sign-in is needed and no account is created (EV-01)
//  - states the role the recipient is asked to act in (EV-02)
//  - NEVER carries progress, score, count or achievement status (OD-17): the input type has no such field
//  - the link-validity line stays empty until OD-18 is decided (optional `validityText`)
//  - no tracking pixel, no attachment, no images, no marketing, no QR code
import { emailCopy as c } from "@/lib/copy"

export interface EvaluationRequestEmailInput {
  programName: string
  studentName: string
  /** Optional: omitted from the intro when the course has no code. */
  courseCode?: string
  evaluatorName: string
  evaluatorEmail: string
  /** Role label read from role data (EV-08): a fourth role needs no template change. */
  roleLabel: string
  skillNames: string[]
  performedIn: "clinical" | "lab"
  settingName?: string | null
  locationName?: string | null
  /** Absolute link to the evaluation. */
  url: string
  /** OD-18 seam: empty until the link lifecycle is decided. */
  validityText?: string
}

export interface EvaluationRequestEmail {
  from: { displayName: string; address: null }
  to: { name: string; email: string }
  subject: string
  text: string
  html: string
}

/** Contract §11: show every skill up to a cap, then "and {k} more" [INFER]. */
export const SKILL_LIST_CAP = 10

export function whereLine(i: Pick<EvaluationRequestEmailInput, "performedIn" | "settingName" | "locationName">): string {
  if (i.performedIn === "lab") return "Lab or simulation"
  return `Clinical${i.settingName ? ` (${i.settingName})` : ""}${i.locationName ? ` at ${i.locationName}` : ""}`
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Email clients do not support CSS variables, so the one brand colour is a CSS named colour (system-safe), checked at
// 4.5:1 against white in the unit tests. No images are needed to understand the message.
export const EMAIL_BUTTON_BACKGROUND = "mediumvioletred"
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export function buildEvaluationRequestEmail(i: EvaluationRequestEmailInput): EvaluationRequestEmail {
  const n = i.skillNames.length
  const shown = i.skillNames.slice(0, SKILL_LIST_CAP)
  const extra = n - shown.length
  const listLines = [...shown, ...(extra > 0 ? [c.more(extra)] : [])]
  const context = [i.courseCode, i.programName].filter(Boolean).join(", ")
  const where = whereLine(i)
  const validity = (i.validityText ?? "").trim()

  const subject = c.subject(i.studentName, n)
  const intro = c.intro(i.studentName, context, n)

  const expect = [c.expectLink, c.expectForm(i.programName), ...(validity ? [validity] : [])]
  const after = [c.afterRecorded(i.studentName), c.afterReview(i.programName)]

  const text = [
    c.greeting(i.evaluatorName),
    "",
    intro,
    "",
    ...listLines.map((l, idx) => (idx < shown.length ? `  - ${l}` : `  ${l}`)),
    "",
    `${c.where} ${where}`,
    `${c.role} ${i.roleLabel}`,
    "",
    c.openLabel,
    i.url,
    "",
    c.expectHeading,
    ...expect.map((l) => `- ${l}`),
    "",
    c.afterHeading,
    ...after.map((l) => `- ${l}`),
    "",
    c.notRight(i.studentName),
    "",
    c.thanks,
    c.signature(i.programName),
  ].join("\n")

  const li = (l: string) => `<li style="margin:0 0 4px 0">${esc(l)}</li>`
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    `<title>${esc(subject)}</title>`,
    "</head>",
    `<body style="margin:0;padding:16px;font-family:${FONT};font-size:16px;line-height:1.5">`,
    '<div style="max-width:560px;margin:0 auto">',
    `<p style="margin:0 0 16px 0">${esc(c.greeting(i.evaluatorName))}</p>`,
    `<p style="margin:0 0 8px 0">${esc(intro)}</p>`,
    `<ul style="margin:0 0 16px 0;padding-left:20px">${shown.map(li).join("")}${extra > 0 ? `<li style="margin:0 0 4px 0;list-style:none">${esc(c.more(extra))}</li>` : ""}</ul>`,
    `<p style="margin:0 0 4px 0"><strong>${esc(c.where)}</strong> ${esc(where)}</p>`,
    `<p style="margin:0 0 16px 0"><strong>${esc(c.role)}</strong> ${esc(i.roleLabel)}</p>`,
    `<p style="margin:0 0 8px 0">${esc(c.openLabel)}</p>`,
    `<p style="margin:0 0 8px 0"><a href="${esc(i.url)}" style="display:inline-block;padding:12px 20px;background-color:${EMAIL_BUTTON_BACKGROUND};color:white;text-decoration:none;font-weight:600;border-radius:6px">${esc(c.button)}</a></p>`,
    `<p style="margin:0 0 20px 0;word-break:break-all"><a href="${esc(i.url)}">${esc(i.url)}</a></p>`,
    `<p style="margin:0 0 4px 0"><strong>${esc(c.expectHeading)}</strong></p>`,
    `<ul style="margin:0 0 16px 0;padding-left:20px">${expect.map(li).join("")}</ul>`,
    `<p style="margin:0 0 4px 0"><strong>${esc(c.afterHeading)}</strong></p>`,
    `<ul style="margin:0 0 16px 0;padding-left:20px">${after.map(li).join("")}</ul>`,
    `<p style="margin:0 0 16px 0">${esc(c.notRight(i.studentName))}</p>`,
    `<p style="margin:0">${esc(c.thanks)}<br>${esc(c.signature(i.programName))}</p>`,
    "</div>",
    "</body>",
    "</html>",
  ].join("\n")

  return {
    from: { displayName: c.signature(i.programName), address: null },
    to: { name: i.evaluatorName, email: i.evaluatorEmail },
    subject,
    text,
    html,
  }
}
