// Copy for "blocked with a reason" states and impossible filters (ST-08, RP-09, IM-09). Built from structured data.
import type { Db } from "@/lib/domain/types"
import type { FilterIssue, SendOptions } from "@/lib/store"

const list = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const role = (db: Db, id: string) => db.roles.find((r) => r.id === id)?.label ?? id
const setting = (db: Db, id: string) => db.clinicalSettings.find((s) => s.id === id)?.name ?? id
const location = (db: Db, id: string) => db.locations.find((l) => l.id === id)?.name ?? id

/** RP-09 (docs/ux/09 S-01): explain, never return a silent empty result. */
export function filterIssueText(issue: FilterIssue, db: Db): string {
  switch (issue.code) {
    case "locationDoesNotOfferSetting":
      return `No evidence can match this combination. ${location(db, issue.locationId)} does not offer ${setting(db, issue.settingId)}. Choose a different setting or location.`
    case "labHasNoLocation":
      return `No evidence can match this combination. Lab or simulation evidence has no location. Clear the location or choose a clinical setting.`
    case "groupNotInCohort":
      return `This group does not belong to the selected cohort. Choose a group from that cohort, or clear the cohort.`
  }
}

export const filterHelper = "Filtering by location or setting counts only evidence gathered there, and recalculates progress."

/** ST-08: the blocking banner for S-13. Names the skill and the constraint, then offers a way forward. */
export function sendBlockedText(blocked: NonNullable<SendOptions["blocked"]>, db: Db, performedIn: "clinical" | "lab", skillName: (id: string) => string): { text: string; switchTo: "clinical" | "lab" | null; separately: boolean } {
  const where = performedIn === "clinical" ? "this clinical setting" : "lab or simulation"
  const first = blocked.perSkill[0]
  const noValidAtAll = blocked.perSkill.length === 1 && first.validRoles.length === 0
  let text: string
  if (noValidAtAll) {
    // BL-1 mirror: the skill can only be signed off by roles that cannot sign off this kind of evidence.
    const kind = performedIn === "clinical" ? "clinical" : "lab"
    text = `${skillName(first.skillId)} can only be signed off by ${list(first.allowedRoles.map((r) => role(db, r)))}, who cannot sign off ${kind} evidence.${blocked.switchTo ? ` Choose ${blocked.switchTo === "lab" ? "Lab or simulation" : "Clinical"}, or ask your program administrator.` : " Ask your program administrator."}`
  } else {
    text = `No evaluator role can sign off all of these skills for ${where}. ${blocked.perSkill.map((p) => `${skillName(p.skillId)} allows ${list(p.allowedRoles.map((r) => role(db, r)))}`).join(". ")}. Choose a different setting or remove a skill from the request.`
  }
  return { text, switchTo: blocked.switchTo, separately: blocked.separately }
}

export const sendCopy = {
  noPlacement: "No placement is recorded for this course. Choose from your program's clinical settings.",
  single: (settingName: string, locationName: string) => `Recorded as ${settingName} at ${locationName}, from your placement.`,
  settingHelper: (n: number) => `From your ${n} ${n === 1 ? "placement" : "placements"} for this course. You may move between settings during a placement, so record where this one happened.`,
  roleHelper: (kind: "clinical" | "lab") => `Roles that can sign off ${kind === "clinical" ? "clinical" : "lab"} evidence for these skills.`,
  noPerson: (roleLabel: string) => `No ${roleLabel.toLowerCase()} is recorded for this setting.`,
  chooseForNewRole: "Choose an evaluator for the new role.",
  namedPrompt: "Evaluator not listed? Enter their name and email so the request can reach them.",
  footer: "The evaluator completes the form your program set up. They do not choose how a skill is evaluated.",
  selfEvalTitle: "Evaluate yourself first",
  selfEvalBody: "Use the same criteria the evaluator will use. They see your answers while evaluating.",
  detailsTitle: "Details for this submission",
  noteLabel: "Your note (optional)",
  noteHelper: "Shown with the submission, separate from the evaluator's comment.",
  sendFailed: "Your request was not sent. Your answers are kept. Try again.",
  confirmation: (skillNames: string[], evaluator: string, roleLabel: string, where: string) => {
    // ST-13: the confirmation names WHAT was sent, to whom, in what role, and in which setting and location.
    const list = skillNames.length <= 1 ? (skillNames[0] ?? "") : `${skillNames.slice(0, -1).join(", ")} and ${skillNames[skillNames.length - 1]}`
    return `Sent ${list} to ${evaluator}, ${roleLabel}. ${where}.`
  },
  where: (kind: "clinical" | "lab", settingName: string | null, locationName: string | null) =>
    kind === "lab" ? "Lab or simulation" : `Clinical${settingName ? ` (${settingName})` : ""}${locationName ? ` at ${locationName}` : ""}`,
} as const
