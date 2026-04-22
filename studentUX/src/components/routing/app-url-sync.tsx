"use client";

import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyPathToStore, buildAppPath } from "@/routing/app-paths";
import { useAppStore } from "@/stores/app-store";

/**
 * Keeps React Router URLs and Zustand navigation state in sync (back/forward, deep links, programmatic nav).
 */
export function AppUrlSync({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const search = location.search;

  const pathRef = React.useRef({ pathname, search });
  pathRef.current = { pathname, search };

  const currentPage = useAppStore((s) => s.currentPage);
  const selectedScheduleId = useAppStore((s) => s.selectedScheduleId);
  const selectedJobId = useAppStore((s) => s.selectedJobId);
  const showJobListFull = useAppStore((s) => s.showJobListFull);
  const jobsTab = useAppStore((s) => s.jobsTab);
  const scheduleTab = useAppStore((s) => s.scheduleTab);
  const profileSettingsOpen = useAppStore((s) => s.profileSettingsOpen);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);

  const skipApplyFromUrlRef = React.useRef(false);
  /** After first `applyPathToStore` from the real URL (deep links, refresh). Until then, skip store→URL so we don't overwrite the address bar before hydration. */
  const urlHydratedToStoreRef = React.useRef(false);

  // 1) Store → URL — runs AFTER first URL hydration only. On the same layout pass as opening a job, this runs
  //    before URL→store so we `navigate` to `/jobs/:id` before `applyPathToStore('/jobs')` would clear `selectedJobId`.
  React.useLayoutEffect(() => {
    if (!urlHydratedToStoreRef.current) return;
    const s = useAppStore.getState();
    const next = buildAppPath({
      currentPage: s.currentPage,
      selectedScheduleId: s.selectedScheduleId,
      selectedJobId: s.selectedJobId,
      showJobListFull: s.showJobListFull,
      jobsTab: s.jobsTab,
      scheduleTab: s.scheduleTab,
      profileSettingsOpen: s.profileSettingsOpen,
      hasSeenWelcome: s.hasSeenWelcome,
    });
    const { pathname: p, search: q } = pathRef.current;
    const cur = `${p}${q}`;
    if (next === cur) return;
    skipApplyFromUrlRef.current = true;
    navigate(next);
  }, [
    currentPage,
    selectedScheduleId,
    selectedJobId,
    showJobListFull,
    jobsTab,
    scheduleTab,
    profileSettingsOpen,
    hasSeenWelcome,
    navigate,
  ]);

  // 2) URL → store (initial load, back/forward, external URL). Skipped once after programmatic navigate above.
  React.useLayoutEffect(() => {
    if (!urlHydratedToStoreRef.current) {
      urlHydratedToStoreRef.current = true;
      applyPathToStore(pathname, search);
      return;
    }
    if (skipApplyFromUrlRef.current) {
      skipApplyFromUrlRef.current = false;
      return;
    }
    applyPathToStore(pathname, search);
  }, [pathname, search]);

  return <>{children}</>;
}
