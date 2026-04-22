/**
 * Maps app navigation state ↔ browser paths for React Router sync.
 */

import { useAppStore } from "@/stores/app-store";

type NavSlice = {
  currentPage: string;
  selectedScheduleId: string | null;
  selectedJobId: string | null;
  showJobListFull: boolean;
  jobsTab: "discover" | "my-jobs";
  scheduleTab: "discover" | "schedule" | "wishlist";
  profileSettingsOpen: boolean;
  hasSeenWelcome: boolean;
};

export function buildAppPath(state: NavSlice): string {
  const {
    currentPage,
    selectedScheduleId,
    selectedJobId,
    showJobListFull,
    jobsTab,
    scheduleTab,
    profileSettingsOpen,
    hasSeenWelcome,
  } = state;

  if (profileSettingsOpen && currentPage === "Home" && hasSeenWelcome) {
    return "/settings";
  }

  if (currentPage === "Schedules") {
    if (selectedScheduleId) {
      return `/schedules/${encodeURIComponent(selectedScheduleId)}`;
    }
    const tab =
      scheduleTab && scheduleTab !== "schedule"
        ? `?tab=${encodeURIComponent(scheduleTab)}`
        : "";
    return `/schedules${tab}`;
  }

  if (currentPage === "Jobs") {
    if (selectedJobId) {
      return `/jobs/${encodeURIComponent(selectedJobId)}`;
    }
    if (showJobListFull) {
      return "/jobs/browse";
    }
    const tab = jobsTab === "my-jobs" ? "?tab=my-jobs" : "";
    return `/jobs${tab}`;
  }

  const map: Record<string, string> = {
    Home: "/",
    "Leo AI": "/leo-ai",
    Reports: "/reports",
    Slots: "/slots",
    Requested: "/requested",
    Approved: "/approved",
    Saved: "/saved",
    "Design System": "/design-system",
    Internship: "/internship",
    Browse: "/browse",
    People: "/people",
    Organizations: "/organizations",
  };

  return map[currentPage] ?? "/";
}

function defaultNavFragment() {
  return {
    selectedScheduleId: null as string | null,
    selectedJobId: null as string | null,
    showJobListFull: false,
    selectedScheduleStudentName: null as string | null,
    selectedScheduleSiteName: null as string | null,
    defaultTab: "pipeline" as const,
    profileSettingsOpen: false,
  };
}

/** Apply URL → Zustand (browser back/forward, deep link, initial load). */
export function applyPathToStore(pathname: string, search: string) {
  const parts = pathname.split("/").filter(Boolean);
  const q = new URLSearchParams(search);

  const base = defaultNavFragment();

  if (parts.length === 0) {
    const hideTop = useAppStore.getState().hideTopTabBarAndInternshipMenu;
    if (hideTop) {
      useAppStore.setState({
        ...base,
        currentPage: "Schedules",
        scheduleTab: "schedule",
      });
      return;
    }
    useAppStore.setState({
      ...base,
      currentPage: "Home",
    });
    return;
  }

  if (parts[0] === "settings" && parts.length === 1) {
    useAppStore.setState({
      ...base,
      currentPage: "Home",
      profileSettingsOpen: true,
    });
    return;
  }

  if (parts[0] === "schedules") {
    if (parts[1]) {
      useAppStore.setState({
        ...base,
        currentPage: "Schedules",
        selectedScheduleId: decodeURIComponent(parts[1]),
        scheduleTab: "schedule",
      });
      return;
    }
    const tab = q.get("tab");
    const scheduleTab =
      tab === "wishlist" || tab === "discover" || tab === "schedule"
        ? tab
        : "schedule";
    useAppStore.setState({
      ...base,
      currentPage: "Schedules",
      scheduleTab,
    });
    return;
  }

  if (parts[0] === "jobs") {
    if (parts[1] === "browse") {
      useAppStore.setState({
        ...base,
        currentPage: "Jobs",
        jobsTab: "discover",
        showJobListFull: true,
      });
      return;
    }
    if (parts[1]) {
      useAppStore.setState({
        ...base,
        currentPage: "Jobs",
        selectedJobId: decodeURIComponent(parts[1]),
      });
      return;
    }
    const tab = q.get("tab");
    const jobsTab = tab === "my-jobs" ? ("my-jobs" as const) : ("discover" as const);
    useAppStore.setState({
      ...base,
      currentPage: "Jobs",
      jobsTab,
    });
    return;
  }

  const single: Record<string, string> = {
    "leo-ai": "Leo AI",
    reports: "Reports",
    slots: "Slots",
    requested: "Requested",
    approved: "Approved",
    saved: "Saved",
    "design-system": "Design System",
    internship: "Internship",
    browse: "Browse",
    people: "People",
    organizations: "Organizations",
  };

  const page = parts.length === 1 ? single[parts[0]] : undefined;
  if (page) {
    useAppStore.setState({
      ...base,
      currentPage: page,
    });
    return;
  }

  useAppStore.setState({
    ...base,
    currentPage: "Home",
  });
}
