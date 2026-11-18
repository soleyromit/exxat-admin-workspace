"use client"

import * as React from "react"
import dynamic from "next/dynamic"

// This module is a client module on purpose: next/dynamic only splits chunks in the client layer. Called from a server
// component, every client screen it names is bundled into one shared chunk (2.6 MB). Pages render <VariantScreen>.
// Each variant screen is a lazy chunk, so a lab page loads only the screen it shows (perf: one 2.6 MB shared chunk before).
// Keys and the exported map shape are unchanged.
const AdminDashboardAShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardAShared))
const AdminDashboardBShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardBShared))
const AdminDashboardCShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardCShared))
const AdminDashboardDShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardDShared))
const AdminDashboardEShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardEShared))
const AdminDashboardFShared = dynamic(() => import("./shared-drills").then((m) => m.AdminDashboardFShared))
const DirectorDashboardAShared = dynamic(() => import("./shared-drills").then((m) => m.DirectorDashboardAShared))
const DirectorDashboardBShared = dynamic(() => import("./shared-drills").then((m) => m.DirectorDashboardBShared))
const AdminDashboardDrill = dynamic(() => import("./admin-dashboard-drill").then((m) => m.AdminDashboardDrill))
const AdminDashboardDrillB = dynamic(() => import("./admin-dashboard-drill-b").then((m) => m.AdminDashboardDrillB))
const AdminEvaluationSettingsG = dynamic(() => import("./admin-evaluation-settings-g").then((m) => m.AdminEvaluationSettingsG))
const AdminEvaluationSettingsK = dynamic(() => import("./admin-evaluation-settings-k").then((m) => m.AdminEvaluationSettingsK))
const AdminEvaluationSettingsM = dynamic(() => import("./admin-evaluation-settings-m").then((m) => m.AdminEvaluationSettingsM))
const AdminEvaluationSettingsO = dynamic(() => import("./admin-evaluation-settings-o").then((m) => m.AdminEvaluationSettingsO))
const AdminEvaluationSettingsP = dynamic(() => import("./admin-evaluation-settings-p").then((m) => m.AdminEvaluationSettingsP))
const AdminEvaluationSettingsQ = dynamic(() => import("./admin-evaluation-settings-q").then((m) => m.AdminEvaluationSettingsQ))
const AdminSetupResultA = dynamic(() => import("./admin-setup-result-a").then((m) => m.AdminSetupResultA))
const AdminSetupSkillsA = dynamic(() => import("./admin-setup-skills-a").then((m) => m.AdminSetupSkillsA))
const AdminSetupSkillsD = dynamic(() => import("./admin-setup-skills-d").then((m) => m.AdminSetupSkillsD))
const AdminSetupResultB = dynamic(() => import("./admin-setup-result-b").then((m) => m.AdminSetupResultB))
const AdminSkillsLibraryA = dynamic(() => import("./admin-skills-library-a").then((m) => m.AdminSkillsLibraryA))
const AdminSkillsLibraryB = dynamic(() => import("./admin-skills-library-b").then((m) => m.AdminSkillsLibraryB))
const AdminSkillsLibraryC = dynamic(() => import("./admin-skills-library-c").then((m) => m.AdminSkillsLibraryC))
const AdminSkillsLibraryF = dynamic(() => import("./admin-skills-library-f").then((m) => m.AdminSkillsLibraryF))
const AdminSkillsLibraryG = dynamic(() => import("./admin-skills-library-g").then((m) => m.AdminSkillsLibraryG))
const AdminSkillsLibraryH = dynamic(() => import("./admin-skills-library-h").then((m) => m.AdminSkillsLibraryH))
const AdminAddSkillA = dynamic(() => import("./admin-add-skill-a").then((m) => m.AdminAddSkillA))
const AdminAddSkillB = dynamic(() => import("./admin-add-skill-b").then((m) => m.AdminAddSkillB))
const AdminAddSkillC = dynamic(() => import("./admin-add-skill-c").then((m) => m.AdminAddSkillC))
const AdminImportA = dynamic(() => import("./admin-import-a").then((m) => m.AdminImportA))
const AdminImportB = dynamic(() => import("./admin-import-b").then((m) => m.AdminImportB))
const AdminImportC = dynamic(() => import("./admin-import-c").then((m) => m.AdminImportC))
const AdminStarterLibraryA = dynamic(() => import("./admin-starter-library-a").then((m) => m.AdminStarterLibraryA))
const AdminStarterLibraryB = dynamic(() => import("./admin-starter-library-b").then((m) => m.AdminStarterLibraryB))
const AdminConfigureSkillA = dynamic(() => import("./admin-configure-skill-a").then((m) => m.AdminConfigureSkillA))
const AdminConfigureSkillB = dynamic(() => import("./admin-configure-skill-b").then((m) => m.AdminConfigureSkillB))
const AdminConfigureSkillC = dynamic(() => import("./admin-configure-skill-c").then((m) => m.AdminConfigureSkillC))
const AdminRuleImpactA = dynamic(() => import("./admin-rule-impact-a").then((m) => m.AdminRuleImpactA))
const AdminRuleImpactB = dynamic(() => import("./admin-rule-impact-b").then((m) => m.AdminRuleImpactB))
const EvaluatorFormA = dynamic(() => import("./evaluator-form-a").then((m) => m.EvaluatorFormA))
const EvaluatorFormB = dynamic(() => import("./evaluator-form-b").then((m) => m.EvaluatorFormB))
const EvaluatorFormC = dynamic(() => import("./evaluator-form-c").then((m) => m.EvaluatorFormC))
const EvaluatorSubmittedA = dynamic(() => import("./evaluator-submitted-a").then((m) => m.EvaluatorSubmittedA))
const EvaluatorExpiredA = dynamic(() => import("./evaluator-expired-a").then((m) => m.EvaluatorExpiredA))
const EvaluatorInvitationEmailA = dynamic(() => import("./evaluator-invitation-email-a").then((m) => m.EvaluatorInvitationEmailA))
const LabInstructorLabBatchGridA = dynamic(() => import("./lab-instructor-lab-batch-grid-a").then((m) => m.LabInstructorLabBatchGridA))
const LabInstructorLabBatchGridB = dynamic(() => import("./lab-instructor-lab-batch-grid-b").then((m) => m.LabInstructorLabBatchGridB))
const ReviewerApprovalsA = dynamic(() => import("./reviewer-approvals-a").then((m) => m.ReviewerApprovalsA))
const ReviewerApprovalsB = dynamic(() => import("./reviewer-approvals-b").then((m) => m.ReviewerApprovalsB))
const ReviewerApprovalsC = dynamic(() => import("./reviewer-approvals-c").then((m) => m.ReviewerApprovalsC))
const ReviewerReviewItemA = dynamic(() => import("./reviewer-review-item-a").then((m) => m.ReviewerReviewItemA))
const ReviewerReviewItemB = dynamic(() => import("./reviewer-review-item-b").then((m) => m.ReviewerReviewItemB))
const ReviewerReviewItemC = dynamic(() => import("./reviewer-review-item-c").then((m) => m.ReviewerReviewItemC))
const ReviewerStudentRecordA = dynamic(() => import("./reviewer-student-record-a").then((m) => m.ReviewerStudentRecordA))
const ReviewerStudentRecordB = dynamic(() => import("./reviewer-student-record-b").then((m) => m.ReviewerStudentRecordB))
const StudentProgressA = dynamic(() => import("./student-progress-a").then((m) => m.StudentProgressA))
const StudentProgressB = dynamic(() => import("./student-progress-b").then((m) => m.StudentProgressB))
const StudentProgressC = dynamic(() => import("./student-progress-c").then((m) => m.StudentProgressC))
const StudentSkillDetailA = dynamic(() => import("./student-skill-detail-a").then((m) => m.StudentSkillDetailA))
const StudentSkillDetailB = dynamic(() => import("./student-skill-detail-b").then((m) => m.StudentSkillDetailB))
const StudentRequestsA = dynamic(() => import("./student-requests-a").then((m) => m.StudentRequestsA))
const StudentRequestsB = dynamic(() => import("./student-requests-b").then((m) => m.StudentRequestsB))
const StudentFixA = dynamic(() => import("./student-fix-a").then((m) => m.StudentFixA))
const StudentFixB = dynamic(() => import("./student-fix-b").then((m) => m.StudentFixB))
const DirectorDashboardC = dynamic(() => import("./director-dashboard-c").then((m) => m.DirectorDashboardC))
const DirectorVerificationDetailA = dynamic(() => import("./director-verification-detail-a").then((m) => m.DirectorVerificationDetailA))
const DirectorVerificationDetailB = dynamic(() => import("./director-verification-detail-b").then((m) => m.DirectorVerificationDetailB))
const StudentLogA = dynamic(() => import("./student-log-a").then((m) => m.StudentLogA))
const StudentLogB = dynamic(() => import("./student-log-b").then((m) => m.StudentLogB))
const StudentRequestA = dynamic(() => import("./student-request-a").then((m) => m.StudentRequestA))
const StudentRequestB = dynamic(() => import("./student-request-b").then((m) => m.StudentRequestB))
const StudentRequestC = dynamic(() => import("./student-request-c").then((m) => m.StudentRequestC))
const StudentRecordA = dynamic(() => import("./student-record-a").then((m) => m.StudentRecordA))
const StudentRecordB = dynamic(() => import("./student-record-b").then((m) => m.StudentRecordB))
const StudentShareA = dynamic(() => import("./student-share-a").then((m) => m.StudentShareA))
const StudentShareB = dynamic(() => import("./student-share-b").then((m) => m.StudentShareB))
const StudentOfflineA = dynamic(() => import("./student-offline-a").then((m) => m.StudentOfflineA))
const StudentOfflineB = dynamic(() => import("./student-offline-b").then((m) => m.StudentOfflineB))
const AdminCourseMappingA = dynamic(() => import("./admin-course-mapping-a").then((m) => m.AdminCourseMappingA))
const AdminCourseMappingB = dynamic(() => import("./admin-course-mapping-b").then((m) => m.AdminCourseMappingB))
const CourseFacultyOfferingCheckoffA = dynamic(() => import("./course-faculty-offering-checkoff-a").then((m) => m.CourseFacultyOfferingCheckoffA))
const CourseFacultyOfferingCheckoffB = dynamic(() => import("./course-faculty-offering-checkoff-b").then((m) => m.CourseFacultyOfferingCheckoffB))
const AdminListsCohortsA = dynamic(() => import("./admin-lists-cohorts-a").then((m) => m.AdminListsCohortsA))
const AdminListsCohortsB = dynamic(() => import("./admin-lists-cohorts-b").then((m) => m.AdminListsCohortsB))
const AdminListsCohortsC = dynamic(() => import("./admin-lists-cohorts-c").then((m) => m.AdminListsCohortsC))
const AdminListsCohortsD = dynamic(() => import("./admin-lists-cohorts-d").then((m) => m.AdminListsCohortsD))
const AdminAttainmentA = dynamic(() => import("./admin-attainment-a").then((m) => m.AdminAttainmentA))
const AdminAttainmentB = dynamic(() => import("./admin-attainment-b").then((m) => m.AdminAttainmentB))
const AdminExportA = dynamic(() => import("./admin-export-a").then((m) => m.AdminExportA))
const AdminExportB = dynamic(() => import("./admin-export-b").then((m) => m.AdminExportB))
const AdminSettingsA = dynamic(() => import("./admin-settings-a").then((m) => m.AdminSettingsA))
const AdminSettingsB = dynamic(() => import("./admin-settings-b").then((m) => m.AdminSettingsB))
const CategoriesTagsMoved = dynamic(() => import("./admin-categories-tags-a").then((m) => m.CategoriesTagsMoved))
const AdminCategoriesTagsB = dynamic(() => import("./admin-categories-tags-b").then((m) => m.AdminCategoriesTagsB))
const AdminDeactivateA = dynamic(() => import("./admin-deactivate-a").then((m) => m.AdminDeactivateA))
const AdminDeactivateB = dynamic(() => import("./admin-deactivate-b").then((m) => m.AdminDeactivateB))
const EvaluatorSubmittedB = dynamic(() => import("./evaluator-submitted-b").then((m) => m.EvaluatorSubmittedB))
const EvaluatorSubmittedC = dynamic(() => import("./evaluator-submitted-c").then((m) => m.EvaluatorSubmittedC))
const EvaluatorExpiredB = dynamic(() => import("./evaluator-expired-b").then((m) => m.EvaluatorExpiredB))
const EvaluatorExpiredC = dynamic(() => import("./evaluator-expired-c").then((m) => m.EvaluatorExpiredC))
const EvaluatorInvitationEmailB = dynamic(() => import("./evaluator-invitation-email-b").then((m) => m.EvaluatorInvitationEmailB))
const EvaluatorInvitationEmailC = dynamic(() => import("./evaluator-invitation-email-c").then((m) => m.EvaluatorInvitationEmailC))
const AdminApprovalsA = dynamic(() => import("./admin-approvals-a").then((m) => m.AdminApprovalsA))
const AdminApprovalsB = dynamic(() => import("./admin-approvals-b").then((m) => m.AdminApprovalsB))
const ReviewerStudentsA = dynamic(() => import("./reviewer-students-a").then((m) => m.ReviewerStudentsA))
const ReviewerStudentsB = dynamic(() => import("./reviewer-students-b").then((m) => m.ReviewerStudentsB))
const ReviewerStudentsC = dynamic(() => import("./reviewer-students-c").then((m) => m.ReviewerStudentsC))
const DirectorAttainmentA = dynamic(() => import("./director-attainment-a").then((m) => m.DirectorAttainmentA))
const DirectorAttainmentB = dynamic(() => import("./director-attainment-b").then((m) => m.DirectorAttainmentB))

/**
 * Built variants, keyed "persona/slug/variantId". To add one: build the component, add `file` to the variant in
 * lib/lab/screens.json, register it here, then run `node scripts/lab-ds-gate.mjs --write`.
 */
export const VARIANT_COMPONENTS: Record<string, React.ComponentType> = {
  "admin/evaluation-settings/G": AdminEvaluationSettingsG,
  "admin/evaluation-settings/K": AdminEvaluationSettingsK,
  "admin/evaluation-settings/M": AdminEvaluationSettingsM,
  "admin/evaluation-settings/O": AdminEvaluationSettingsO,
  "admin/evaluation-settings/P": AdminEvaluationSettingsP,
  "admin/evaluation-settings/Q": AdminEvaluationSettingsQ,
  "admin/setup-result/A": AdminSetupResultA,
  "admin/setup-result/C": AdminSetupSkillsA,
  "admin/setup-result/D": AdminSetupSkillsD,
  "admin/setup-result/B": AdminSetupResultB,
  "admin/course-mapping/A": AdminCourseMappingA,
  "admin/course-mapping/B": AdminCourseMappingB,
  "course-faculty/offering-checkoff/A": CourseFacultyOfferingCheckoffA,
  "course-faculty/offering-checkoff/B": CourseFacultyOfferingCheckoffB,
  "admin/lists-cohorts/A": AdminListsCohortsA,
  "admin/lists-cohorts/B": AdminListsCohortsB,
  "admin/lists-cohorts/C": AdminListsCohortsC,
  "admin/lists-cohorts/D": AdminListsCohortsD,
  "admin/attainment/A": AdminAttainmentA,
  "admin/attainment/B": AdminAttainmentB,
  "admin/export/A": AdminExportA,
  "admin/export/B": AdminExportB,
  "admin/settings/A": AdminSettingsA,
  "admin/settings/B": AdminSettingsB,
  // Moved to the Categories and tags tab of Skill lists (2026-11-16): the old address opens that tab.
  "admin/categories-tags/A": CategoriesTagsMoved,
  "admin/categories-tags/B": AdminCategoriesTagsB,
  "admin/retire-deactivate/A": AdminDeactivateA,
  "admin/retire-deactivate/B": AdminDeactivateB,
  "admin/dashboard/A": AdminDashboardAShared,
  "admin/dashboard/B": AdminDashboardBShared,
  "admin/dashboard/C": AdminDashboardCShared,
  "admin/dashboard/D": AdminDashboardDShared,
  "admin/dashboard/E": AdminDashboardEShared,
  "admin/dashboard/F": AdminDashboardFShared,
  "admin/dashboard-drill/A": AdminDashboardDrill,
  "admin/dashboard-drill/B": AdminDashboardDrillB,
  "admin/skills-library/A": AdminSkillsLibraryA,
  "admin/skills-library/B": AdminSkillsLibraryB,
  "admin/skills-library/C": AdminSkillsLibraryC,
  // Variant E (the add step is the page) is unregistered, not deleted: tier 1 holds six variants and round add-skills-simple added F and G. Its file and `addMode="page"` remain.
  "admin/skills-library/F": AdminSkillsLibraryF,
  "admin/skills-library/G": AdminSkillsLibraryG,
  "admin/skills-library/H": AdminSkillsLibraryH,
  "admin/add-skill/A": AdminAddSkillA,
  "admin/add-skill/B": AdminAddSkillB,
  "admin/add-skill/C": AdminAddSkillC,
  "admin/import-ai-review/A": AdminImportA,
  "admin/import-ai-review/B": AdminImportB,
  "admin/import-ai-review/C": AdminImportC,
  "admin/starter-library/A": AdminStarterLibraryA,
  "admin/starter-library/B": AdminStarterLibraryB,
  "admin/configure-skill/A": AdminConfigureSkillA,
  "admin/configure-skill/B": AdminConfigureSkillB,
  "admin/configure-skill/C": AdminConfigureSkillC,
  "admin/rule-change-impact/A": AdminRuleImpactA,
  "admin/rule-change-impact/B": AdminRuleImpactB,
  "evaluator/evaluation-form/A": EvaluatorFormA,
  "evaluator/evaluation-form/B": EvaluatorFormB,
  "evaluator/evaluation-form/C": EvaluatorFormC,
  "evaluator/submitted/A": EvaluatorSubmittedA,
  "evaluator/expired/A": EvaluatorExpiredA,
  "evaluator/invitation-email/A": EvaluatorInvitationEmailA,
  "course-faculty/lab-batch-grid/A": LabInstructorLabBatchGridA,
  "course-faculty/lab-batch-grid/B": LabInstructorLabBatchGridB,
  "reviewer/approvals/A": ReviewerApprovalsA,
  "reviewer/approvals/B": ReviewerApprovalsB,
  "reviewer/approvals/C": ReviewerApprovalsC,
  "reviewer/review-item/A": ReviewerReviewItemA,
  "reviewer/review-item/B": ReviewerReviewItemB,
  "reviewer/review-item/C": ReviewerReviewItemC,
  "reviewer/student-record/A": ReviewerStudentRecordA,
  "reviewer/student-record/B": ReviewerStudentRecordB,
  "student/home/A": StudentProgressA,
  "student/home/B": StudentProgressB,
  "student/home/C": StudentProgressC,
  "student/skill-detail/A": StudentSkillDetailA,
  "student/skill-detail/B": StudentSkillDetailB,
  "student/my-requests/A": StudentRequestsA,
  "student/my-requests/B": StudentRequestsB,
  "student/fix-returned/A": StudentFixA,
  "student/fix-returned/B": StudentFixB,
  "director/dashboard/A": DirectorDashboardAShared,
  "director/dashboard/B": DirectorDashboardBShared,
  "director/dashboard/C": DirectorDashboardC,
  "director/verification-detail/A": DirectorVerificationDetailA,
  "director/verification-detail/B": DirectorVerificationDetailB,
  "student/log-skill/A": StudentLogA,
  "student/log-skill/B": StudentLogB,
  "student/request-signoff/A": StudentRequestA,
  "student/request-signoff/B": StudentRequestB,
  "student/request-signoff/C": StudentRequestC,
  "student/record/A": StudentRecordA,
  "student/record/B": StudentRecordB,
  "student/share-record/A": StudentShareA,
  "student/share-record/B": StudentShareB,
  "student/offline-sync/A": StudentOfflineA,
  "student/offline-sync/B": StudentOfflineB,
  "evaluator/submitted/B": EvaluatorSubmittedB,
  "evaluator/submitted/C": EvaluatorSubmittedC,
  "evaluator/expired/B": EvaluatorExpiredB,
  "evaluator/expired/C": EvaluatorExpiredC,
  "evaluator/invitation-email/B": EvaluatorInvitationEmailB,
  "evaluator/invitation-email/C": EvaluatorInvitationEmailC,
  "admin/approvals/A": AdminApprovalsA,
  "admin/approvals/B": AdminApprovalsB,
  "reviewer/students/A": ReviewerStudentsA,
  "reviewer/students/B": ReviewerStudentsB,
  "reviewer/students/C": ReviewerStudentsC,
  "director/attainment/A": DirectorAttainmentA,
  "director/attainment/B": DirectorAttainmentB,
}

/** Renders the registered screen for a "persona/slug/variantId" key, or `fallback` when none is registered. */
export function VariantScreen({ variantKey, fallback = null }: { variantKey: string; fallback?: React.ReactNode }) {
  const Built = VARIANT_COMPONENTS[variantKey]
  return Built ? <Built /> : <>{fallback}</>
}
