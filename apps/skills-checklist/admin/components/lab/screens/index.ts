import type * as React from "react"
import { AdminDashboardAShared, AdminDashboardBShared, AdminDashboardCShared, AdminDashboardDShared, AdminDashboardEShared, AdminDashboardFShared, DirectorDashboardAShared, DirectorDashboardBShared } from "./shared-drills"
import { AdminDashboardA } from "./admin-dashboard-a"
import { AdminDashboardB } from "./admin-dashboard-b"
import { AdminDashboardPipeline } from "./admin-dashboard-pipeline"
import { AdminDashboardD } from "./admin-dashboard-d"
import { AdminDashboardOps } from "./admin-dashboard-ops"
import { AdminDashboardF } from "./admin-dashboard-f"
import { AdminDashboardDrill } from "./admin-dashboard-drill"
import { AdminDashboardDrillB } from "./admin-dashboard-drill-b"
import { AdminSkillsLibraryA } from "./admin-skills-library-a"
import { AdminSkillsLibraryB } from "./admin-skills-library-b"
import { AdminSkillsLibraryC } from "./admin-skills-library-c"
import { AdminAddSkillA } from "./admin-add-skill-a"
import { AdminAddSkillB } from "./admin-add-skill-b"
import { AdminAddSkillC } from "./admin-add-skill-c"
import { AdminImportA } from "./admin-import-a"
import { AdminImportB } from "./admin-import-b"
import { AdminImportC } from "./admin-import-c"
import { AdminStarterLibraryA } from "./admin-starter-library-a"
import { AdminStarterLibraryB } from "./admin-starter-library-b"
import { AdminConfigureSkillA } from "./admin-configure-skill-a"
import { AdminConfigureSkillB } from "./admin-configure-skill-b"
import { AdminConfigureSkillC } from "./admin-configure-skill-c"
import { AdminRuleImpactA } from "./admin-rule-impact-a"
import { AdminRuleImpactB } from "./admin-rule-impact-b"
import { EvaluatorFormA } from "./evaluator-form-a"
import { EvaluatorFormB } from "./evaluator-form-b"
import { EvaluatorFormC } from "./evaluator-form-c"
import { EvaluatorSubmittedA } from "./evaluator-submitted-a"
import { EvaluatorExpiredA } from "./evaluator-expired-a"
import { EvaluatorInvitationEmailA } from "./evaluator-invitation-email-a"
import { LabInstructorLabBatchGridA } from "./lab-instructor-lab-batch-grid-a"
import { LabInstructorLabBatchGridB } from "./lab-instructor-lab-batch-grid-b"
import { ReviewerApprovalsA } from "./reviewer-approvals-a"
import { ReviewerApprovalsB } from "./reviewer-approvals-b"
import { ReviewerApprovalsC } from "./reviewer-approvals-c"
import { ReviewerReviewItemA } from "./reviewer-review-item-a"
import { ReviewerReviewItemB } from "./reviewer-review-item-b"
import { ReviewerReviewItemC } from "./reviewer-review-item-c"
import { ReviewerStudentRecordA } from "./reviewer-student-record-a"
import { ReviewerStudentRecordB } from "./reviewer-student-record-b"
import { StudentProgressA } from "./student-progress-a"
import { StudentProgressB } from "./student-progress-b"
import { StudentProgressC } from "./student-progress-c"
import { StudentSkillDetailA } from "./student-skill-detail-a"
import { StudentSkillDetailB } from "./student-skill-detail-b"
import { StudentRequestsA } from "./student-requests-a"
import { StudentRequestsB } from "./student-requests-b"
import { StudentFixA } from "./student-fix-a"
import { StudentFixB } from "./student-fix-b"
import { DirectorDashboardA } from "./director-dashboard-a"
import { DirectorDashboardB } from "./director-dashboard-b"
import { DirectorDashboardC } from "./director-dashboard-c"
import { DirectorVerificationDetailA } from "./director-verification-detail-a"
import { DirectorVerificationDetailB } from "./director-verification-detail-b"
import { DirectorReportsA } from "./director-reports-a"
import { DirectorReportsB } from "./director-reports-b"
import { StudentLogA } from "./student-log-a"
import { StudentLogB } from "./student-log-b"
import { StudentRequestA } from "./student-request-a"
import { StudentRequestB } from "./student-request-b"
import { StudentRecordA } from "./student-record-a"
import { StudentRecordB } from "./student-record-b"
import { StudentShareA } from "./student-share-a"
import { StudentShareB } from "./student-share-b"
import { StudentOfflineA } from "./student-offline-a"
import { StudentOfflineB } from "./student-offline-b"
import { AdminCourseMappingA } from "./admin-course-mapping-a"
import { AdminCourseMappingB } from "./admin-course-mapping-b"
import { AdminListsCohortsA } from "./admin-lists-cohorts-a"
import { AdminListsCohortsB } from "./admin-lists-cohorts-b"
import { AdminEvaluatorDirectoryA } from "./admin-evaluator-directory-a"
import { AdminEvaluatorDirectoryB } from "./admin-evaluator-directory-b"
import { AdminAttainmentA } from "./admin-attainment-a"
import { AdminAttainmentB } from "./admin-attainment-b"
import { AdminExportA } from "./admin-export-a"
import { AdminExportB } from "./admin-export-b"
import { AdminSettingsA } from "./admin-settings-a"
import { AdminSettingsB } from "./admin-settings-b"
import { AdminDeactivateA } from "./admin-deactivate-a"
import { AdminDeactivateB } from "./admin-deactivate-b"
import { EvaluatorSubmittedB } from "./evaluator-submitted-b"
import { EvaluatorSubmittedC } from "./evaluator-submitted-c"
import { EvaluatorExpiredB } from "./evaluator-expired-b"
import { EvaluatorExpiredC } from "./evaluator-expired-c"
import { EvaluatorInvitationEmailB } from "./evaluator-invitation-email-b"
import { EvaluatorInvitationEmailC } from "./evaluator-invitation-email-c"
import { AdminApprovalsA } from "./admin-approvals-a"
import { AdminApprovalsB } from "./admin-approvals-b"
import { ReviewerStudentsA } from "./reviewer-students-a"
import { ReviewerStudentsB } from "./reviewer-students-b"
import { ReviewerStudentsC } from "./reviewer-students-c"
import { DirectorAttainmentA } from "./director-attainment-a"
import { DirectorAttainmentB } from "./director-attainment-b"

/**
 * Built variants, keyed "persona/slug/variantId". To add one: build the component, add `file` to the variant in
 * lib/lab/screens.json, register it here, then run `node scripts/lab-ds-gate.mjs --write`.
 */
export const VARIANT_COMPONENTS: Record<string, React.ComponentType> = {
  "admin/course-mapping/A": AdminCourseMappingA,
  "admin/course-mapping/B": AdminCourseMappingB,
  "admin/lists-cohorts/A": AdminListsCohortsA,
  "admin/lists-cohorts/B": AdminListsCohortsB,
  "admin/evaluator-directory/A": AdminEvaluatorDirectoryA,
  "admin/evaluator-directory/B": AdminEvaluatorDirectoryB,
  "admin/attainment/A": AdminAttainmentA,
  "admin/attainment/B": AdminAttainmentB,
  "admin/export/A": AdminExportA,
  "admin/export/B": AdminExportB,
  "admin/settings/A": AdminSettingsA,
  "admin/settings/B": AdminSettingsB,
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
  "lab-instructor/lab-batch-grid/A": LabInstructorLabBatchGridA,
  "lab-instructor/lab-batch-grid/B": LabInstructorLabBatchGridB,
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
  "director/reports/A": DirectorReportsA,
  "director/reports/B": DirectorReportsB,
  "student/log-skill/A": StudentLogA,
  "student/log-skill/B": StudentLogB,
  "student/request-signoff/A": StudentRequestA,
  "student/request-signoff/B": StudentRequestB,
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
