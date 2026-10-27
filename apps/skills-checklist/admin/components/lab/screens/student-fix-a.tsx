"use client"

/**
 * Student Fix a returned or did-not-qualify submission, variant A: guided, one column, with what is about to be sent beside it.
 * Tests: does reading why it came back in one compact banner, then three numbered sections (where and when, who signs, note), with
 * the path (correction or further attempt) said once and the Send footer, get a correct resubmission in one pass?
 * Regions (form budget 4): header (skill as subtitle) · reason and path · numbered sections · "Your attempt" summary from 1280 px.
 * Footer: Back (My requests); Save for later (further attempt) and the one primary. Layout per Romit 2026-10-27 ("Need a better form
 * layout"). ?submission=<id> (returned, or waiting and not assessed yet: RV-01) or ?skill=<id>, ?student=<id>.
 * Maya's waiting request (?submission=sub-maya-1) shows correct and resend; ?student=stu-g-067 shows the returned path.
 * [REQ RV-01..RV-05, ST-05..ST-10, ST-12, ST-13]
 */
import * as React from "react"
import type { StudentFrameCtx } from "@/components/lab/student/frame"
import { FixPage, FixSummary, fixTitle } from "@/components/lab/student/fix"
import { fixModel } from "@/lib/lab/student"

export const fixTitleOf = (c: StudentFrameCtx) => fixTitle(fixModel(c.state, c.studentId, { submissionId: c.param("submission"), skillId: c.param("skill") }))

export function StudentFixA() {
  return <FixPage marker="fix-A" aside={(f, api) => (api.sent ? null : <FixSummary f={f} api={api} />)} />
}
