/**
 * ASSESSMENT-TAKER ROUTER
 *
 * End-to-end student journey (per Aarti's architecture):
 *
 *   /                      → Assessment Dashboard (active exams first)
 *   /exam/:id/setup        → Pre-Exam Flow (system check → instructions → accommodation → ready)
 *   /exam/:id/take         → Exam Engine (App.tsx — untouched accessibility-first experience)
 *   /exam/:id/submitted    → Post-Submission (confirmation + publication status)
 *   /exam/:id/results      → Exam Results (score + competency breakdown)
 *   /exam/:id/review       → Scheduled Review Session (lockdown, correct answers visible)
 *   /competency            → Cross-Course Competency Dashboard
 *
 * Entry points (per Aarti):
 *   1. Via Prism dashboard tile → lands at /
 *   2. Standalone login (144 approved-only users) → lands at /
 *   3. Email link → lands at /exam/:id/setup directly
 *
 * NavShell wraps all routes except the exam engine (/exam/:id/take) to provide
 * persistent navigation, notifications, and profile access.
 */

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { NavShell } from './components/NavShell';
import { DevReviewHUD } from './dev/DevReviewHUD';
import { AssessmentDashboard } from './pages/AssessmentDashboard';
import { PreExamFlow } from './pages/PreExamFlow';
import { PostExam } from './pages/PostExam';
import { ExamResults } from './pages/ExamResults';
import { CompetencyDashboard } from './pages/CompetencyDashboard';
import { ReviewSession } from './pages/ReviewSession';
import { ResultsChat } from './pages/ResultsChat';
import { PastAssessments } from './pages/PastAssessments';
import { StudyResources } from './pages/StudyResources';
import { SettingsPage, HelpPage } from './pages/PlaceholderPage';
import { App as ExamEngine } from './App';

// Root layout — renders the active route plus the live review overlay.
// The literal `import.meta.env.DEV &&` lets Rollup dead-code-eliminate the HUD
// (and axe-core) from every production build — Vercel preview/dev/prod are all
// `vite build`, so the overlay never ships. A second hostname guard inside the
// HUD covers the edge case of an exposed/previewed dev server.
function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <DevReviewHUD product="apps/exam-management/assessment-taker" />}
    </>
  );
}

const childRoutes = [
  {
    path: '/',
    element: (
      <NavShell>
        <AssessmentDashboard />
      </NavShell>
    ),
  },
  {
    // Pre-exam flow: no NavShell — focused lockdown experience starts here
    path: '/exam/:id/setup',
    element: <PreExamFlow />,
  },
  {
    // Exam engine: no NavShell — full-screen lockdown experience
    path: '/exam/:id/take',
    element: <ExamEngine />,
  },
  {
    path: '/exam/:id/submitted',
    element: (
      <NavShell title="Exam Submitted">
        <PostExam />
      </NavShell>
    ),
  },
  {
    path: '/exam/:id/results',
    element: (
      <NavShell title="Exam Results">
        <ExamResults />
      </NavShell>
    ),
  },
  {
    // Lockdown review session — full-screen, no NavShell. Aarti-mandated:
    // students see same exam with correct answers + rationale; copy/screenshot
    // disabled at UI level (OS-level lockdown deferred to Jan 2027).
    path: '/exam/:id/review',
    element: <ReviewSession />,
  },
  {
    path: '/competency',
    element: (
      <NavShell title="Competency Progress">
        <CompetencyDashboard />
      </NavShell>
    ),
  },
  {
    // Post-results faculty chat — gated by institution + course toggles
    // (mocked as ON for the demo). Reachable from the results page CTA.
    path: '/exam/:id/chat',
    element: (
      <NavShell title="Faculty Q&A">
        <ResultsChat />
      </NavShell>
    ),
  },
  {
    path: '/history',
    element: (
      <NavShell title="Past Assessments">
        <PastAssessments />
      </NavShell>
    ),
  },
  {
    path: '/resources',
    element: (
      <NavShell title="Study Resources">
        <StudyResources />
      </NavShell>
    ),
  },
  {
    path: '/settings',
    element: (
      <NavShell title="Settings">
        <SettingsPage />
      </NavShell>
    ),
  },
  {
    path: '/help',
    element: (
      <NavShell title="Get Help">
        <HelpPage />
      </NavShell>
    ),
  },
];

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: childRoutes,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
