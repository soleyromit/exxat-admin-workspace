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
 */

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AssessmentDashboard } from './pages/AssessmentDashboard';
import { PreExamFlow } from './pages/PreExamFlow';
import { PostExam } from './pages/PostExam';
import { ExamResults } from './pages/ExamResults';
import { CompetencyDashboard } from './pages/CompetencyDashboard';
import { App as ExamEngine } from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AssessmentDashboard />,
  },
  {
    path: '/exam/:id/setup',
    element: <PreExamFlow />,
  },
  {
    path: '/exam/:id/take',
    element: <ExamEngine />,
  },
  {
    path: '/exam/:id/submitted',
    element: <PostExam />,
  },
  {
    path: '/exam/:id/results',
    element: <ExamResults />,
  },
  {
    path: '/competency',
    element: <CompetencyDashboard />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
