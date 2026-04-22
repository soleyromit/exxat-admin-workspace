import { create } from 'zustand'

export type DensityMode = "comfortable" | "compact";

interface AppState {
  // Navigation state
  sidebarOpen: boolean
  showNotifications: boolean
  designSystemTab: string
  designSystemSection: string | null
  currentPage: string
  defaultTab: string
  jobsTab: "discover" | "my-jobs"
  scheduleTab: "discover" | "schedule" | "wishlist"
  scheduleView: "board" | "calendar" | "grid"
  selectedScheduleId: string | null
  selectedJobId: string | null
  /** Mobile: true when "View all" opened full job list (Case 2) */
  showJobListFull: boolean

  // Schedule detail metadata (student + site combination)
  selectedScheduleStudentName: string | null
  selectedScheduleSiteName: string | null

  // Leo AI Panel state
  showLeoPanel: boolean
  leoPanelContext: string
  leoInitialQuery: string

  // Density — Comfortable (default) | Compact (for Windows 125% / enterprise)
  density: DensityMode

  // Product switcher (Exxat One | Exxat Prism)
  currentProductId: string
  /** "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover" — banner-top: full-width 32px bar at top */
  productSwitcherApproach: "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover"

  /** "default" | "webp" | "1st-time" | "hero" — Home product card illustration set (switchable from profile menu) */
  homeCardIllustrationSet: "default" | "webp" | "1st-time" | "hero"

  /** Profile settings modal open — increases main page margin when open */
  profileSettingsOpen: boolean

  /** Apply job modal open — increases main page margin when open (like profile) */
  applyJobModalOpen: boolean

  /** Main page margin for apply modal — set with delay after modal opens (animate at end) */
  applyJobModalMarginActive: boolean

  /** Job IDs the user has applied to (persisted) */
  appliedJobIds: string[]

  /** Dev: My Jobs empty state mode — "off" | "page" | "section" */
  myJobsEmptyState: "off" | "page" | "section"

  /** Dev: Internship empty state — "placement-not-enabled" | "school-not-on-platform" | "off" */
  internshipEmptyState: "placement-not-enabled" | "school-not-on-platform" | "off"

  /** Dev: Wishlist empty state — "off" | "no-wishlist" | "all-closed" */
  wishlistEmptyState: "off" | "no-wishlist" | "all-closed"

  /** Dev: Home section IDs to hide (e.g. "cards", "todo", "quick-access") */
  hiddenHomeSections: string[]

  /** Dev: Schedule page banner — "off" | "compliance-nearing" | "payment-nearing" | "overdue" */
  scheduleBannerType: "off" | "compliance-nearing" | "payment-nearing" | "overdue"

  /** Dev: Schedules empty state — "off" | "empty" | "school-not-on-platform" */
  scheduleEmptyState: "off" | "empty" | "school-not-on-platform"

  /** Welcome page shown before Home (one-time setup prompt) */
  hasSeenWelcome: boolean

  /** When true, Home content and header nav animate in (set by Go to home, cleared after animation) */
  justTransitionedFromWelcome: boolean

  /** When true, forces product switcher coach mark to show (from profile menu) */
  showProductSwitcherCoachMark: boolean

  /** When true: hide top tab bar (Schedule|Wishlist), Internship = direct link to Schedules, default landing = Schedules */
  hideTopTabBarAndInternshipMenu: boolean

  /** Job search bar placeholder variant — "default" (static) | "animated" (rotating suggestions) */
  jobSearchBarVariant: "default" | "animated"

  // Actions
  setSidebarOpen: (open: boolean) => void
  setShowNotifications: (show: boolean) => void
  setDesignSystemTab: (tab: string) => void
  setDesignSystemSection: (section: string | null) => void
  setCurrentPage: (page: string) => void
  setDefaultTab: (tab: string) => void
  setJobsTab: (tab: "discover" | "my-jobs") => void
  setScheduleTab: (tab: "discover" | "schedule" | "wishlist") => void
  setScheduleView: (view: "board" | "calendar" | "grid") => void
  setSelectedScheduleId: (id: string | null) => void
  setSelectedJobId: (id: string | null) => void
  setSelectedScheduleStudentName: (name: string | null) => void
  setSelectedScheduleSiteName: (name: string | null) => void
  setShowLeoPanel: (show: boolean) => void
  setLeoPanelContext: (context: string) => void
  setLeoInitialQuery: (query: string) => void
  setDensity: (density: DensityMode) => void
  setCurrentProductId: (id: string) => void
  setProductSwitcherApproach: (approach: "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover") => void
  setHomeCardIllustrationSet: (set: "default" | "webp" | "1st-time" | "hero") => void
  setProfileSettingsOpen: (open: boolean) => void
  setApplyJobModalOpen: (open: boolean) => void
  setApplyJobModalMarginActive: (active: boolean) => void
  addAppliedJob: (jobId: string) => void
  setMyJobsEmptyState: (mode: "off" | "page" | "section") => void
  setInternshipEmptyState: (mode: "placement-not-enabled" | "school-not-on-platform" | "off") => void
  setWishlistEmptyState: (mode: "off" | "no-wishlist" | "all-closed") => void
  toggleHiddenHomeSection: (sectionId: string) => void
  setScheduleBannerType: (type: "off" | "compliance-nearing" | "payment-nearing" | "overdue") => void
  setScheduleEmptyState: (mode: "off" | "empty" | "school-not-on-platform") => void
  setHasSeenWelcome: (seen: boolean) => void
  setJustTransitionedFromWelcome: (value: boolean) => void
  setShowProductSwitcherCoachMark: (show: boolean) => void
  setHideTopTabBarAndInternshipMenu: (hide: boolean) => void
  setJobSearchBarVariant: (variant: "default" | "animated") => void

  // Navigation actions
  navigateToPage: (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => void
  navigateToLeoAI: () => void
  navigateToHome: () => void
  navigateToScheduleDetail: (scheduleId: string, studentName?: string, siteName?: string) => void
  navigateBackFromScheduleDetail: () => void
  /** Open job detail. Pass `fromJobList: true` when opening from the full job list or in-detail list so `showJobListFull` stays true for back navigation. */
  navigateToJobDetail: (jobId: string, options?: { fromJobList?: boolean }) => void
  navigateBackFromJobDetail: () => void
  navigateToJobListFull: () => void
  navigateBackFromJobListFull: () => void
  toggleLeoPanel: () => void
  openLeoPanelWithQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sidebarOpen: true,
  showNotifications: false,
  designSystemTab: "foundation",
  designSystemSection: null,
  currentPage: (() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("hideTopTabBarAndInternshipMenu") === "true") {
      return "Schedules";
    }
    return "Home";
  })(),
  defaultTab: "pipeline",
  jobsTab: "discover",
  scheduleTab: "schedule",
  scheduleView: "board",
  selectedScheduleId: null,
  selectedJobId: null,
  showJobListFull: false,
  selectedScheduleStudentName: null,
  selectedScheduleSiteName: null,
  showLeoPanel: false,
  leoPanelContext: "Home",
  leoInitialQuery: "",
  density: "comfortable",
  currentProductId: "exxat-one",
  productSwitcherApproach: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("productSwitcherApproach");
      const valid = ["logo-area", "icon-next-to-help", "logo-chevron", "banner-ver", "banner-top", "header-and-banner", "header-and-banner-inline", "greeting-popover"];
      if (saved && valid.includes(saved)) return saved as "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover";
    }
    return "header-and-banner-inline";
  })(),
  homeCardIllustrationSet: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("homeCardIllustrationSet");
      if (saved === "default" || saved === "webp" || saved === "1st-time" || saved === "hero") return saved;
    }
    return "webp";
  })(),
  profileSettingsOpen: false,
  applyJobModalOpen: false,
  applyJobModalMarginActive: false,
  appliedJobIds: (() => {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("appliedJobIds");
        if (saved) {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return [];
  })(),
  myJobsEmptyState: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("myJobsEmptyState");
      if (saved === "page" || saved === "section" || saved === "off") return saved;
    }
    return "off";
  })(),
  internshipEmptyState: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("internshipEmptyState");
      if (saved === "placement-not-enabled" || saved === "school-not-on-platform" || saved === "off") return saved;
    }
    return "off";
  })(),
  wishlistEmptyState: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("wishlistEmptyState");
      if (saved === "no-wishlist" || saved === "all-closed" || saved === "off") return saved;
    }
    return "off";
  })(),
  hiddenHomeSections: (() => {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("hiddenHomeSections");
        if (saved) {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return [];
  })(),
  scheduleBannerType: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("scheduleBannerType");
      if (saved === "compliance-nearing" || saved === "payment-nearing" || saved === "overdue") return saved;
    }
    return "off";
  })(),
  scheduleEmptyState: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("scheduleEmptyState");
      if (saved === "empty" || saved === "off" || saved === "school-not-on-platform") return saved;
    }
    return "off";
  })(),
  hasSeenWelcome: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("exxat_has_seen_welcome");
      return saved === "true";
    }
    return false;
  })(),
  justTransitionedFromWelcome: false,
  showProductSwitcherCoachMark: false,
  hideTopTabBarAndInternshipMenu: (() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("hideTopTabBarAndInternshipMenu") === "true";
    }
    return false;
  })(),
  jobSearchBarVariant: (() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("jobSearchBarVariant");
      if (saved === "default" || saved === "animated") return saved;
    }
    return "default";
  })(),

  // Basic setters
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setShowNotifications: (show: boolean) => set({ showNotifications: show }),
  setDesignSystemTab: (tab: string) => set({ designSystemTab: tab, designSystemSection: null }),
  setDesignSystemSection: (section: string | null) => set({ designSystemSection: section }),
  setCurrentPage: (page: string) => set({ currentPage: page }),
  setDefaultTab: (tab: string) => set({ defaultTab: tab }),
  setJobsTab: (tab: "discover" | "my-jobs") => set({ jobsTab: tab }),
  setScheduleTab: (tab: "discover" | "schedule" | "wishlist") => set({ scheduleTab: tab }),
  setScheduleView: (view: "board" | "calendar" | "grid") => set({ scheduleView: view }),
  setSelectedScheduleId: (id: string | null) => set({ selectedScheduleId: id }),
  setSelectedJobId: (id: string | null) => set({ selectedJobId: id }),
  setSelectedScheduleStudentName: (name: string | null) => set({ selectedScheduleStudentName: name }),
  setSelectedScheduleSiteName: (name: string | null) => set({ selectedScheduleSiteName: name }),
  setShowLeoPanel: (show: boolean) => set({ showLeoPanel: show }),
  setLeoPanelContext: (context: string) => set({ leoPanelContext: context }),
  setLeoInitialQuery: (query: string) => set({ leoInitialQuery: query }),
  setDensity: (density: DensityMode) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("density", density);
    set({ density });
  },
  setCurrentProductId: (id: string) => set({ currentProductId: id }),
  setProductSwitcherApproach: (approach: "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("productSwitcherApproach", approach);
    }
    set({ productSwitcherApproach: approach });
  },
  setHomeCardIllustrationSet: (illustrationSet: "default" | "webp" | "1st-time" | "hero") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("homeCardIllustrationSet", illustrationSet);
    }
    set({ homeCardIllustrationSet: illustrationSet });
  },
  setProfileSettingsOpen: (open: boolean) => set({ profileSettingsOpen: open }),
  setApplyJobModalOpen: (open: boolean) => set({ applyJobModalOpen: open, ...(open ? {} : { applyJobModalMarginActive: false }) }),
  setApplyJobModalMarginActive: (active: boolean) => set({ applyJobModalMarginActive: active }),
  addAppliedJob: (jobId: string) => {
    set((s) => {
      if (s.appliedJobIds.includes(jobId)) return s;
      const next = [...s.appliedJobIds, jobId];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("appliedJobIds", JSON.stringify(next));
      }
      return { appliedJobIds: next };
    });
  },
  setMyJobsEmptyState: (mode: "off" | "page" | "section") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("myJobsEmptyState", mode);
    }
    set({ myJobsEmptyState: mode });
  },
  setInternshipEmptyState: (mode: "placement-not-enabled" | "school-not-on-platform" | "off") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("internshipEmptyState", mode);
    }
    set({ internshipEmptyState: mode });
  },
  setWishlistEmptyState: (mode: "off" | "no-wishlist" | "all-closed") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("wishlistEmptyState", mode);
    }
    set({ wishlistEmptyState: mode });
  },
  setScheduleBannerType: (type: "off" | "compliance-nearing" | "payment-nearing" | "overdue") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("scheduleBannerType", type);
    }
    set({ scheduleBannerType: type });
  },
  setScheduleEmptyState: (mode: "off" | "empty" | "school-not-on-platform") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("scheduleEmptyState", mode);
    }
    set({ scheduleEmptyState: mode });
  },
  toggleHiddenHomeSection: (sectionId: string) => {
    set((state) => {
      const next = state.hiddenHomeSections.includes(sectionId)
        ? state.hiddenHomeSections.filter((id) => id !== sectionId)
        : [...state.hiddenHomeSections, sectionId];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("hiddenHomeSections", JSON.stringify(next));
      }
      return { hiddenHomeSections: next };
    });
  },
  setHasSeenWelcome: (seen: boolean) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("exxat_has_seen_welcome", String(seen));
    }
    set({ hasSeenWelcome: seen });
  },
  setJustTransitionedFromWelcome: (value: boolean) => set({ justTransitionedFromWelcome: value }),
  setShowProductSwitcherCoachMark: (show: boolean) => set({ showProductSwitcherCoachMark: show }),
  setHideTopTabBarAndInternshipMenu: (hide: boolean) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hideTopTabBarAndInternshipMenu", String(hide));
    }
    set({ hideTopTabBarAndInternshipMenu: hide });
  },
  setJobSearchBarVariant: (variant: "default" | "animated") => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("jobSearchBarVariant", variant);
    }
    set({ jobSearchBarVariant: variant });
  },

  // Navigation actions
  navigateToPage: (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => {
    if (page === "Settings") {
      set({
        currentPage: "Home",
        profileSettingsOpen: true,
        selectedScheduleId: null,
        selectedJobId: null,
        showJobListFull: false,
        selectedScheduleStudentName: null,
        selectedScheduleSiteName: null,
        defaultTab: "pipeline",
      });
      return;
    }
    // Internship defaults to Schedules page with schedule tab
    const resolvedPage = page === "Internship" ? "Schedules" : page;
    const resolvedOptions = page === "Internship"
      ? { ...options, scheduleTab: options?.scheduleTab ?? "schedule" }
      : options;

    set({
      currentPage: resolvedPage,
      selectedScheduleId: null,
      selectedJobId: null,
      showJobListFull: false,
      selectedScheduleStudentName: null,
      selectedScheduleSiteName: null,
      defaultTab: "pipeline",
      profileSettingsOpen: false,
      ...(resolvedPage === "Jobs" && {
        jobsTab: resolvedOptions?.jobsTab ?? "discover",
      }),
      ...(resolvedPage === "Schedules" && {
        scheduleTab: resolvedOptions?.scheduleTab ?? "schedule",
      }),
    });
  },

  navigateToLeoAI: () => {
    set({ currentPage: "Leo AI", profileSettingsOpen: false })
  },

  navigateToHome: () => {
    const { hideTopTabBarAndInternshipMenu } = get();
    if (hideTopTabBarAndInternshipMenu) {
      get().navigateToPage("Schedules", { scheduleTab: "schedule" });
    } else {
      set({ currentPage: "Home", profileSettingsOpen: false });
    }
  },

  navigateToScheduleDetail: (scheduleId: string, studentName?: string, siteName?: string) => {
    set({
      selectedScheduleId: scheduleId,
      selectedScheduleStudentName: studentName || null,
      selectedScheduleSiteName: siteName || null,
      profileSettingsOpen: false,
    })
  },

  navigateBackFromScheduleDetail: () => {
    set({ 
      selectedScheduleId: null,
      selectedScheduleStudentName: null,
      selectedScheduleSiteName: null,
    })
  },

  navigateToJobDetail: (jobId: string, options?: { fromJobList?: boolean }) => {
    const id = jobId?.trim();
    if (!id) return;
    set({
      currentPage: "Jobs",
      selectedJobId: id,
      profileSettingsOpen: false,
      ...(options?.fromJobList ? {} : { showJobListFull: false }),
    });
  },

  navigateBackFromJobDetail: () => {
    set({ selectedJobId: null, applyJobModalOpen: false, applyJobModalMarginActive: false })
  },

  navigateToJobListFull: () => {
    set({ currentPage: "Jobs", showJobListFull: true, profileSettingsOpen: false })
  },

  navigateBackFromJobListFull: () => {
    set({ showJobListFull: false })
  },

  toggleLeoPanel: () => {
    const state = get()
    set({ showLeoPanel: !state.showLeoPanel })
  },

  openLeoPanelWithQuery: (query: string) => {
    set({ showLeoPanel: true, leoInitialQuery: query })
  }
}))