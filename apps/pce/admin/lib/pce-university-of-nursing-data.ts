// ============================================================================
// "University of Nursing" demo account — BSN/MSN dummy-data scenario.
//
// Self-contained on purpose: `UON_OFFERINGS`/`UON_SURVEYS` are NOT appended to
// the global `MOCK_COURSE_OFFERINGS`/`MOCK_SURVEYS` arrays in pce-mock-data.ts
// (those double as the literal account payload for `acc-healthy`/
// `acc-demo-default` — appending here would leak these 15 courses into the
// Johns Hopkins DPT default view). They're wired into their own DemoAccount
// in pce-demo-accounts.ts instead, which IS how `activeOfferings()`/
// `activeSurveys()` read them.
//
// `MOCK_SURVEY_QUESTION_DATA` / `MOCK_RESPONSES` / `MOCK_OPEN_TEXT_RESPONSES`
// / `MOCK_MASTER_COURSES` ARE extended directly in pce-mock-data.ts — those
// are flat lookup tables keyed by surveyId/masterCourseId, read by results
// pages via direct import (not through the account-scoped `usePce()`
// context), so appending is additive and safe (new unique ids only surface
// when this account's own surveys are opened).
//
// Both terms reuse this course's real Johns Hopkins DPT faculty (f1–f6) —
// same reuse pattern buildCaseTermData() already uses for Case 4–9 — rather
// than inventing a second faculty roster the rest of the app (Faculty
// directory, MOCK_FACULTY) has no way to resolve.
//
// Term-average caveat (shared with every other single-account Case
// scenario in pce-demo-accounts.ts): `app/(app)/results/[id]/page.tsx`'s
// "vs term average" stat filters the GLOBAL `MOCK_SURVEYS` by literal
// `term` string, not by account. Reusing 'Fall 2026'/'Summer 2026' as this
// account's term names means that stat will blend in the Johns Hopkins DPT
// courses sharing those term names — a pre-existing, accepted limitation
// (dashboard/course list/analytics ARE correctly account-scoped; this one
// deep-dive comparison is not).

import type { CourseOffering, FacultyOfferingRecord, PceInstructor, PceSurvey } from '@/lib/pce-mock-data'
import { MOCK_RESPONSES, MOCK_SURVEY_QUESTION_DATA } from '@/lib/pce-mock-data'

const PATEL: PceInstructor = { id: 'f1', name: 'Dr. Anita Patel', initials: 'AP', role: 'primary' }
const CHEN: PceInstructor = { id: 'f2', name: 'Dr. Kevin Chen', initials: 'KC', role: 'primary' }
const WILLIAMS: PceInstructor = { id: 'f3', name: 'Dr. Maria Williams', initials: 'MW', role: 'primary' }
const KIM: PceInstructor = { id: 'f4', name: 'Dr. James Kim', initials: 'JK', role: 'primary' }
const GOMEZ: PceInstructor = { id: 'f5', name: 'Dr. Rachel Gomez', initials: 'RG', role: 'primary' }
const HASSAN: PceInstructor = { id: 'f6', name: 'Dr. Omar Hassan', initials: 'OH', role: 'primary' }
// No guest-lecturer pairings in this account (Monil/Vishal, 2026-09-16 demo
// bar: "instructor and coordinator or 2 instructors") — co-taught records
// pair two `role: 'primary'` instructors and let `facultyEvalRole()` derive
// Coordinator / Instructor / Lab Assistant from each person's position.

export const UON_OFFERINGS: CourseOffering[] = [
  // ── Fall 2026 (pt5) — current term, 10 courses ──────────────────────────
  { id: 'uon-off-f1',  masterCourseId: 'mc23', termId: 'pt5', cohort: 'Class of 2029',      primaryFacultyId: 'f1', collaboratorIds: [],       enrolledCount: 65, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f2',  masterCourseId: 'mc24', termId: 'pt5', cohort: 'Class of 2029',      primaryFacultyId: 'f4', collaboratorIds: [],       enrolledCount: 58, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f3',  masterCourseId: 'mc25', termId: 'pt5', cohort: 'Class of 2028',      primaryFacultyId: 'f3', collaboratorIds: [],       enrolledCount: 72, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f4',  masterCourseId: 'mc26', termId: 'pt5', cohort: 'Class of 2028',      primaryFacultyId: 'f2', collaboratorIds: ['f5'],   enrolledCount: 80, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f5',  masterCourseId: 'mc27', termId: 'pt5', cohort: 'Class of 2027',      primaryFacultyId: 'f1', collaboratorIds: [],       enrolledCount: 44, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f6',  masterCourseId: 'mc28', termId: 'pt5', cohort: 'Class of 2027',      primaryFacultyId: 'f5', collaboratorIds: [],       enrolledCount: 36, status: 'active', courseType: 'clinical' },
  { id: 'uon-off-f7',  masterCourseId: 'mc29', termId: 'pt5', cohort: 'Class of 2027',      primaryFacultyId: 'f3', collaboratorIds: [],       enrolledCount: 40, status: 'active', courseType: 'clinical' },
  { id: 'uon-off-f8',  masterCourseId: 'mc30', termId: 'pt5', cohort: 'Class of 2026',      primaryFacultyId: 'f6', collaboratorIds: ['f4'],   enrolledCount: 20, status: 'active', courseType: 'clinical' },
  { id: 'uon-off-f9',  masterCourseId: 'mc31', termId: 'pt5', cohort: 'Class of 2026',      primaryFacultyId: 'f2', collaboratorIds: [],       enrolledCount: 50, status: 'active', courseType: 'didactic' },
  { id: 'uon-off-f10', masterCourseId: 'mc32', termId: 'pt5', cohort: 'MSN Cohort 2027',    primaryFacultyId: 'f3', collaboratorIds: [],       enrolledCount: 30, status: 'active', courseType: 'didactic' },
  // ── Summer 2026 (pt9) — last closed term, 5 courses ─────────────────────
  { id: 'uon-off-s1',  masterCourseId: 'mc23', termId: 'pt9', cohort: 'Class of 2029',      primaryFacultyId: 'f1', collaboratorIds: [],       enrolledCount: 40, status: 'completed', courseType: 'didactic' },
  { id: 'uon-off-s2',  masterCourseId: 'mc25', termId: 'pt9', cohort: 'Class of 2028',      primaryFacultyId: 'f3', collaboratorIds: [],       enrolledCount: 45, status: 'completed', courseType: 'didactic' },
  { id: 'uon-off-s3',  masterCourseId: 'mc26', termId: 'pt9', cohort: 'Class of 2028',      primaryFacultyId: 'f2', collaboratorIds: [],       enrolledCount: 50, status: 'completed', courseType: 'didactic' },
  { id: 'uon-off-s4',  masterCourseId: 'mc27', termId: 'pt9', cohort: 'Class of 2027',      primaryFacultyId: 'f5', collaboratorIds: [],       enrolledCount: 35, status: 'completed', courseType: 'didactic' },
  { id: 'uon-off-s5',  masterCourseId: 'mc32', termId: 'pt9', cohort: 'MSN Cohort 2027',    primaryFacultyId: 'f6', collaboratorIds: [],       enrolledCount: 25, status: 'completed', courseType: 'didactic' },
]

export const UON_SURVEYS: PceSurvey[] = [
  // ══════════════════════ Fall 2026 — current term (10) ══════════════════════
  {
    id: 'uon-f1', courseCode: 'BSN-101', courseName: 'Fundamentals of Nursing I', term: 'Fall 2026', cohort: 'Class of 2029',
    courseType: 'didactic', templateId: 'tmpl1', status: 'closed', instructors: [PATEL],
    responseRate: 91, responseCount: 59, enrollmentCount: 65, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 65 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 70 },
      { term: 'Fall 2025', courseAvg: 4.2, facultyAvg: 4.3, responseRate: 75 },
      { term: 'Spring 2026', courseAvg: 4.2, facultyAvg: 4.3, responseRate: 80 },
      { term: 'Summer 2026', courseAvg: 4.3, facultyAvg: 4.4, responseRate: 90 },
    ],
  },
  {
    id: 'uon-f2', courseCode: 'BSN-115', courseName: 'Health Assessment', term: 'Fall 2026', cohort: 'Class of 2029',
    courseType: 'didactic', templateId: 'tmpl1', status: 'closed', instructors: [KIM],
    responseRate: 59, responseCount: 34, enrollmentCount: 58, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 3.4, facultyAvg: 3.7, responseRate: 60 },
      { term: 'Spring 2025', courseAvg: 3.3, facultyAvg: 3.6, responseRate: 55 },
      { term: 'Fall 2025', courseAvg: 3.3, facultyAvg: 3.7, responseRate: 62 },
      { term: 'Spring 2026', courseAvg: 3.2, facultyAvg: 3.6, responseRate: 58 },
      { term: 'Summer 2026', courseAvg: 3.2, facultyAvg: 3.6, responseRate: 50 },
    ],
  },
  {
    id: 'uon-f3', courseCode: 'BSN-201', courseName: 'Pathophysiology', term: 'Fall 2026', cohort: 'Class of 2028',
    courseType: 'didactic', templateId: 'tmpl1', status: 'closed', instructors: [WILLIAMS],
    responseRate: 31, responseCount: 22, enrollmentCount: 72, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 3.4, facultyAvg: 3.6, responseRate: 55 },
      { term: 'Spring 2025', courseAvg: 3.3, facultyAvg: 3.5, responseRate: 50 },
      { term: 'Fall 2025', courseAvg: 3.2, facultyAvg: 3.4, responseRate: 45 },
      {
        term: 'Spring 2026', courseAvg: 3.0, facultyAvg: 3.3, responseRate: 40,
        concerns: ['Course materials', 'Assessment quality'],
        actionItems: [{ text: 'Refresh lecture slides to the current edition’s disease-classification system', priority: 'high' }],
      },
      { term: 'Summer 2026', courseAvg: 3.3, facultyAvg: 3.6, responseRate: 42 },
    ],
  },
  {
    id: 'uon-f4', courseCode: 'BSN-210', courseName: 'Pharmacology for Nurses', term: 'Fall 2026', cohort: 'Class of 2028',
    courseType: 'didactic', templateId: 'tmpl1', status: 'closed', instructors: [CHEN, GOMEZ],
    responseRate: 78, responseCount: 62, enrollmentCount: 80, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    // Edge case: highly controversial — stable-good history, then a mid-term
    // switch to a new case-based dosage-calculation format this term split
    // the class (see the bimodal MOCK_SURVEY_QUESTION_DATA distribution and
    // the comments in MOCK_RESPONSES).
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 70 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 72 },
      { term: 'Fall 2025', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 75 },
      { term: 'Spring 2026', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 80 },
      { term: 'Summer 2026', courseAvg: 4.1, facultyAvg: 4.3, responseRate: 88 },
    ],
  },
  {
    id: 'uon-f5', courseCode: 'BSN-305', courseName: 'Medical-Surgical Nursing I', term: 'Fall 2026', cohort: 'Class of 2027',
    courseType: 'didactic', templateId: 'tmpl1', status: 'closed', instructors: [PATEL],
    responseRate: 91, responseCount: 40, enrollmentCount: 44, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 4.1, facultyAvg: 4.3, responseRate: 70 },
      { term: 'Spring 2025', courseAvg: 4.2, facultyAvg: 4.4, responseRate: 68 },
      { term: 'Fall 2025', courseAvg: 4.1, facultyAvg: 4.3, responseRate: 72 },
      { term: 'Spring 2026', courseAvg: 4.2, facultyAvg: 4.4, responseRate: 75 },
      {
        term: 'Summer 2026', courseAvg: 3.9, facultyAvg: 4.1, responseRate: 29,
        concerns: ['Pacing'],
        actionItems: [{ text: 'Give the wound-care skills lab a full session instead of splitting it across two', priority: 'medium' }],
      },
    ],
  },
  {
    id: 'uon-f6', courseCode: 'BSN-315', courseName: 'Maternal-Newborn Nursing', term: 'Fall 2026', cohort: 'Class of 2027',
    courseType: 'clinical', templateId: 'tmpl1', status: 'collecting', instructors: [GOMEZ],
    responseRate: 31, responseCount: 11, enrollmentCount: 36, deadline: 'Dec 4, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-11', surveyType: 'course_evaluation', openDate: '2026-11-10', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 65 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 70 },
      { term: 'Fall 2025', courseAvg: 4.0, facultyAvg: 4.2, responseRate: 68 },
      { term: 'Spring 2026', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 72 },
      { term: 'Summer 2026', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 60 },
    ],
  },
  {
    id: 'uon-f7', courseCode: 'BSN-325', courseName: 'Pediatric Nursing', term: 'Fall 2026', cohort: 'Class of 2027',
    courseType: 'clinical', templateId: 'tmpl1', status: 'collecting', instructors: [WILLIAMS],
    responseRate: 23, responseCount: 9, enrollmentCount: 40, deadline: 'Dec 4, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-11', surveyType: 'course_evaluation', openDate: '2026-11-10', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 3.8, facultyAvg: 4.0, responseRate: 68 },
      { term: 'Spring 2025', courseAvg: 3.7, facultyAvg: 3.9, responseRate: 60 },
      { term: 'Fall 2025', courseAvg: 3.8, facultyAvg: 4.0, responseRate: 55 },
      { term: 'Spring 2026', courseAvg: 3.7, facultyAvg: 3.9, responseRate: 45 },
      { term: 'Summer 2026', courseAvg: 3.7, facultyAvg: 3.9, responseRate: 35 },
    ],
  },
  {
    id: 'uon-f8', courseCode: 'BSN-401', courseName: 'Clinical Practicum I', term: 'Fall 2026', cohort: 'Class of 2026',
    courseType: 'clinical', templateId: 'tmpl1', status: 'closed', instructors: [KIM, HASSAN],
    responseRate: 95, responseCount: 19, enrollmentCount: 20, deadline: 'Nov 20, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-14', surveyType: 'course_evaluation', openDate: '2026-11-06', academicYear: '2026–2027', programId: 'prog1',
    // Edge case: stellar/perfect — consistently excellent history, this is a
    // hallmark course, not a one-off (see the near-unanimous distribution).
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 4.6, facultyAvg: 4.7, responseRate: 88 },
      { term: 'Spring 2025', courseAvg: 4.7, facultyAvg: 4.8, responseRate: 90 },
      { term: 'Fall 2025', courseAvg: 4.7, facultyAvg: 4.8, responseRate: 92 },
      { term: 'Spring 2026', courseAvg: 4.8, facultyAvg: 4.9, responseRate: 93 },
      { term: 'Summer 2026', courseAvg: 4.8, facultyAvg: 4.9, responseRate: 94 },
    ],
  },
  {
    id: 'uon-f9', courseCode: 'BSN-415', courseName: 'Psychiatric-Mental Health Nursing', term: 'Fall 2026', cohort: 'Class of 2026',
    courseType: 'didactic', templateId: 'tmpl1', status: 'active', instructors: [CHEN],
    responseRate: 42, responseCount: 21, enrollmentCount: 50, deadline: 'Dec 4, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-11', surveyType: 'course_evaluation', openDate: '2026-11-10', academicYear: '2026–2027', programId: 'prog1',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 3.5, facultyAvg: 3.7, responseRate: 60 },
      { term: 'Spring 2025', courseAvg: 3.4, facultyAvg: 3.6, responseRate: 55 },
      { term: 'Fall 2025', courseAvg: 3.5, facultyAvg: 3.8, responseRate: 58 },
      { term: 'Spring 2026', courseAvg: 3.4, facultyAvg: 3.7, responseRate: 50 },
      { term: 'Summer 2026', courseAvg: 3.4, facultyAvg: 3.7, responseRate: 45 },
    ],
  },
  {
    id: 'uon-f10', courseCode: 'MSN-601', courseName: 'Advanced Pathophysiology', term: 'Fall 2026', cohort: 'MSN Cohort 2027',
    courseType: 'didactic', templateId: 'tmpl1', status: 'collecting', instructors: [WILLIAMS],
    responseRate: 27, responseCount: 8, enrollmentCount: 30, deadline: 'Dec 4, 2026', createdAt: 'Aug 1, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-11-11', surveyType: 'course_evaluation', openDate: '2026-11-10', academicYear: '2026–2027', programId: 'prog2',
    priorOfferings: [
      { term: 'Fall 2024', courseAvg: 3.6, facultyAvg: 3.9, responseRate: 60 },
      { term: 'Spring 2025', courseAvg: 3.7, facultyAvg: 4.0, responseRate: 65 },
      { term: 'Fall 2025', courseAvg: 3.8, facultyAvg: 4.1, responseRate: 70 },
      { term: 'Spring 2026', courseAvg: 3.9, facultyAvg: 4.2, responseRate: 75 },
      // Jump reflects Dr. Hassan taking over the Summer 2026 section (see uon-s5).
      { term: 'Summer 2026', courseAvg: 4.4, facultyAvg: 4.5, responseRate: 92 },
    ],
  },

  // ══════════════════════ Summer 2026 — last closed term (5) ══════════════════════
  {
    id: 'uon-s1', courseCode: 'BSN-101', courseName: 'Fundamentals of Nursing I', term: 'Summer 2026', cohort: 'Class of 2029',
    courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [PATEL],
    responseRate: 90, responseCount: 36, enrollmentCount: 40, deadline: 'Aug 12, 2026', createdAt: 'May 20, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-02', releasedAt: 'Aug 18, 2026', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.9, facultyAvg: 4.0, responseRate: 55 },
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 65 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 70 },
      { term: 'Fall 2025', courseAvg: 4.2, facultyAvg: 4.3, responseRate: 75 },
      { term: 'Spring 2026', courseAvg: 4.2, facultyAvg: 4.3, responseRate: 80 },
    ],
  },
  {
    id: 'uon-s2', courseCode: 'BSN-201', courseName: 'Pathophysiology', term: 'Summer 2026', cohort: 'Class of 2028',
    courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [WILLIAMS],
    responseRate: 42, responseCount: 19, enrollmentCount: 45, deadline: 'Aug 14, 2026', createdAt: 'May 20, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-03', releasedAt: 'Aug 20, 2026', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.5, facultyAvg: 3.7, responseRate: 60 },
      { term: 'Fall 2024', courseAvg: 3.4, facultyAvg: 3.6, responseRate: 55 },
      { term: 'Spring 2025', courseAvg: 3.3, facultyAvg: 3.5, responseRate: 50 },
      { term: 'Fall 2025', courseAvg: 3.2, facultyAvg: 3.4, responseRate: 45 },
      { term: 'Spring 2026', courseAvg: 3.0, facultyAvg: 3.3, responseRate: 40, concerns: ['Course materials', 'Assessment quality'] },
    ],
  },
  {
    id: 'uon-s3', courseCode: 'BSN-210', courseName: 'Pharmacology for Nurses', term: 'Summer 2026', cohort: 'Class of 2028',
    courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [CHEN],
    responseRate: 88, responseCount: 44, enrollmentCount: 50, deadline: 'Aug 14, 2026', createdAt: 'May 20, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-03', releasedAt: 'Aug 20, 2026', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.9, facultyAvg: 4.0, responseRate: 65 },
      { term: 'Fall 2024', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 70 },
      { term: 'Spring 2025', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 72 },
      { term: 'Fall 2025', courseAvg: 4.0, facultyAvg: 4.1, responseRate: 75 },
      { term: 'Spring 2026', courseAvg: 4.1, facultyAvg: 4.2, responseRate: 80 },
    ],
  },
  {
    id: 'uon-s4', courseCode: 'BSN-305', courseName: 'Medical-Surgical Nursing I', term: 'Summer 2026', cohort: 'Class of 2027',
    courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [GOMEZ],
    responseRate: 29, responseCount: 10, enrollmentCount: 35, deadline: 'Aug 16, 2026', createdAt: 'May 20, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-04', releasedAt: 'Aug 22, 2026', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog1',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 4.0, facultyAvg: 4.2, responseRate: 65 },
      { term: 'Fall 2024', courseAvg: 4.1, facultyAvg: 4.3, responseRate: 70 },
      { term: 'Spring 2025', courseAvg: 4.2, facultyAvg: 4.4, responseRate: 68 },
      { term: 'Fall 2025', courseAvg: 4.1, facultyAvg: 4.3, responseRate: 72 },
      { term: 'Spring 2026', courseAvg: 4.2, facultyAvg: 4.4, responseRate: 75 },
    ],
  },
  {
    id: 'uon-s5', courseCode: 'MSN-601', courseName: 'Advanced Pathophysiology', term: 'Summer 2026', cohort: 'MSN Cohort 2027',
    courseType: 'didactic', templateId: 'tmpl1', status: 'released', instructors: [HASSAN],
    responseRate: 92, responseCount: 23, enrollmentCount: 25, deadline: 'Aug 18, 2026', createdAt: 'May 20, 2026',
    createdBy: 'Dr. Anita Patel', lastReminderSentAt: '2026-08-05', releasedAt: 'Aug 24, 2026', surveyType: 'course_evaluation', openDate: '2026-07-20', academicYear: '2025–2026', programId: 'prog2',
    priorOfferings: [
      { term: 'Spring 2024', courseAvg: 3.5, facultyAvg: 3.8, responseRate: 55 },
      { term: 'Fall 2024', courseAvg: 3.6, facultyAvg: 3.9, responseRate: 60 },
      { term: 'Spring 2025', courseAvg: 3.7, facultyAvg: 4.0, responseRate: 65 },
      { term: 'Fall 2025', courseAvg: 3.8, facultyAvg: 4.1, responseRate: 70 },
      { term: 'Spring 2026', courseAvg: 3.9, facultyAvg: 4.2, responseRate: 75 },
    ],
  },
]

/* ── Analytics score register for this account ──────────────────────────────
 * `/analytics` derives everything from `FacultyOfferingRecord`s (one row per
 * course × term × cohort × instructor), a separate universe from `PceSurvey`.
 * Until 2026-09-16 the Analytics page read the global `MOCK_FACULTY_OFFERINGS`
 * regardless of the active demo account, so switching to this account changed
 * the Dashboard and `/results/[id]` but left Analytics on Johns Hopkins DPT
 * numbers. These rows are DERIVED from the surveys above (no second
 * hand-authored score set to drift): current/last-closed terms take each
 * instructor's real per-question averages from `MOCK_SURVEY_QUESTION_DATA`
 * and the course score from `MOCK_RESPONSES`; the 5-term history comes from
 * each survey's `priorOfferings`, attributed to its first-listed instructor. */
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const r2 = (v: number) => Math.round(v * 100) / 100

/* Terms this account really ran (Fall 2026 / Summer 2026, with real offerings
 * and surveys). History rows are only added for OTHER terms: a Fall 2026
 * survey's `priorOfferings` also lists Summer 2026, and keeping those made
 * Analytics count 10 Summer 2026 offerings while the Dashboard (reading the
 * account's real `UON_OFFERINGS`) shows 5 — the two surfaces must agree. */
const LIVE_TERMS = new Set(UON_SURVEYS.map((s) => s.term))

export const UON_FACULTY_OFFERINGS: FacultyOfferingRecord[] = UON_SURVEYS.flatMap((s) => {
  const q = MOCK_SURVEY_QUESTION_DATA.find((d) => d.surveyId === s.id)
  const resp = MOCK_RESPONSES.find((r) => r.surveyId === s.id)
  const courseAvg =
    resp?.sectionScores.find((x) => x.section === 'course_content')?.avg ??
    mean(Object.values(q?.sectionScores ?? {}).flat().map((x) => x.avg)) ??
    undefined
  const surveyFacultyAvg = resp?.sectionScores.find((x) => x.section === 'faculty_performance')?.avg
  const enrolled = s.enrollmentCount
  const current: FacultyOfferingRecord[] = s.instructors.map((inst) => {
    const block = q?.instructorBlocks?.find((b) => b.instructorId === inst.id)
    const own = mean((block?.scores ?? []).map((x) => x.avg))
    return {
      facultyId: inst.id,
      surveyId: s.id,
      courseCode: s.courseCode,
      courseName: s.courseName,
      term: s.term,
      cohort: s.cohort,
      role: inst.role,
      enrolled,
      responseRate: s.responseRate,
      avgRating: r2(own ?? surveyFacultyAvg ?? courseAvg ?? 4),
      courseAvg: courseAvg != null ? r2(courseAvg) : undefined,
    }
  })
  const lead = s.instructors[0]
  const history: FacultyOfferingRecord[] = lead
    ? (s.priorOfferings ?? []).filter((po) => !LIVE_TERMS.has(po.term)).map((po) => ({
        facultyId: lead.id,
        courseCode: s.courseCode,
        courseName: s.courseName,
        term: po.term,
        cohort: s.cohort,
        role: lead.role,
        enrolled,
        responseRate: po.responseRate ?? s.responseRate,
        avgRating: po.facultyAvg,
        courseAvg: po.courseAvg,
      }))
    : []
  return [...current, ...history]
})
