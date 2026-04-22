import * as React from "react";
import { TopSidebar } from "./components/layout/top-sidebar";
import { sidebarData } from "./components/layout/sidebar-data";
import { HomeCards } from "./components/pages/home-cards";
import { HomeCareerSection } from "./components/pages/home-career-section";
import { HomeCareerJourneySection } from "./components/pages/home-career-journey-section";
import { HomePromoSection } from "./components/pages/home-promo-section";
import { HomeExxatPrismBanner } from "./components/pages/home-exxat-prism-banner";
import { HomeTodoSection } from "./components/pages/home-todo-section";
import { HomeQuickAccessSection } from "./components/pages/home-quick-access-section";
import { JobsPage } from "./components/pages/jobs-page";
import { JobDetailPage } from "./components/pages/job-detail-page";
import { JobListPage } from "./components/pages/job-list-page";
import { InternshipPage } from "./components/pages/internship-page";
import { WelcomePage } from "./components/pages/welcome-page";
import { useIsMobile } from "./components/ui/use-mobile";
import { SectionWithHeader } from "./components/shared/section-with-header";
import { SidebarInset } from "./components/ui/sidebar";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { TooltipProvider } from "./components/ui/tooltip";
import { cn } from "./components/ui/utils";
import { useAppStore } from "./stores/app-store";
import { AppUrlSync } from "./components/routing/app-url-sync";

// ─── React.lazy: Code-split ALL heavy page components ────────────────────────
// Each page bundle only loads when first navigated to, reducing initial JS by ~60%
// Import paths use the organized /components/{pages,features,shared}/ structure.

const LazyLeoAIPage = React.lazy(() =>
  import("./components/pages/leo-ai-page").then(m => ({ default: m.LeoAIPage }))
);
const LazyReportsPage = React.lazy(() =>
  import("./components/pages/reports-page").then(m => ({ default: m.ReportsPage }))
);
const LazyRequestedSlotsPage = React.lazy(() =>
  import("./components/pages/requested-slots-page").then(m => ({ default: m.RequestedSlotsPage }))
);
const LazyApprovedSlotsPage = React.lazy(() =>
  import("./components/pages/approved-slots-page").then(m => ({ default: m.ApprovedSlotsPage }))
);
const LazySlotsPage = React.lazy(() =>
  import("./components/pages/slots-page").then(m => ({ default: m.SlotsPage }))
);
const LazyDesignSystemPage = React.lazy(() =>
  import("./components/pages/design-system-page").then(m => ({ default: m.DesignSystemPage }))
);
const LazySchedulePage = React.lazy(() =>
  import("./components/pages/schedule-page").then(m => ({ default: m.SchedulePage }))
);
const LazyScheduleDetailPage = React.lazy(() =>
  import("./components/pages/schedule-detail-page").then(m => ({ default: m.ScheduleDetailPage }))
);
const LazyLeoPanel = React.lazy(() =>
  import("./components/features/leo-panel").then(m => ({ default: m.LeoPanel }))
);
const LazyChatProvider = React.lazy(() =>
  import("./components/features/chat-context").then(m => ({ default: m.ChatProvider }))
);
// ─── Skeleton loader for Suspense boundaries ────────────────────────────────
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[200px]">
    <div className="animate-pulse space-y-4 w-full max-w-2xl px-8">
      <div className="h-8 bg-muted rounded-lg w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
      <div className="h-64 bg-muted rounded-lg mt-4" />
    </div>
  </div>
);

// ─── Consolidated store selectors ────────────────────────────────────────────
// Using individual selectors for state (prevents unnecessary re-renders)
// but grouping action selectors into a single stable reference via `useRef`-style
// since Zustand actions never change identity.

/** Grab all navigation actions once — they're stable across renders */
const useActions = () => {
  const store = useAppStore;
  return React.useMemo(() => ({
    setShowNotifications: store.getState().setShowNotifications,
    navigateToPage: store.getState().navigateToPage,
    navigateToScheduleDetail: store.getState().navigateToScheduleDetail,
    navigateBackFromScheduleDetail: store.getState().navigateBackFromScheduleDetail,
    toggleLeoPanel: store.getState().toggleLeoPanel,
    openLeoPanelWithQuery: store.getState().openLeoPanelWithQuery,
    setLeoPanelContext: store.getState().setLeoPanelContext,
    setDensity: store.getState().setDensity,
  }), []);
};

// ─── Main App ────────────────────────────────────────────────────────────────

function App() {
  // ── State selectors (each subscribes only to its own slice) ──
  const currentPage = useAppStore((s) => s.currentPage);
  const jobsTab = useAppStore((s) => s.jobsTab);
  const scheduleTab = useAppStore((s) => s.scheduleTab);
  const selectedScheduleId = useAppStore(s => s.selectedScheduleId);
  const selectedJobId = useAppStore(s => s.selectedJobId);
  const showJobListFull = useAppStore(s => s.showJobListFull);
  const showLeoPanel = useAppStore(s => s.showLeoPanel);
  const profileSettingsOpen = useAppStore(s => s.profileSettingsOpen);
  const applyJobModalOpen = useAppStore(s => s.applyJobModalOpen);
  const applyJobModalMarginActive = useAppStore(s => s.applyJobModalMarginActive);
  const isMobile = useIsMobile();
  const leoPanelContext = useAppStore(s => s.leoPanelContext);
  const density = useAppStore(s => s.density);
  const productSwitcherApproach = useAppStore((s) => s.productSwitcherApproach);
  const hiddenHomeSections = useAppStore((s) => s.hiddenHomeSections);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);
  const justTransitionedFromWelcome = useAppStore((s) => s.justTransitionedFromWelcome);

  // ── Stable action references (never cause re-renders) ──
  const actions = useActions();

  // ── useTransition: Keep the UI responsive during heavy page transitions ──
  const [isPending, startTransition] = React.useTransition();

  // ── Sync Leo panel context with navigation state ──
  React.useEffect(() => {
    let context = currentPage;
    if (selectedScheduleId) context = "Schedule Detail";
    actions.setLeoPanelContext(context);
  }, [currentPage, selectedScheduleId, actions]);

  // ── Sync density to html attribute ──
  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  // ── Clear welcome transition flag after animation completes ──
  React.useEffect(() => {
    if (!justTransitionedFromWelcome) return;
    const id = setTimeout(() => {
      useAppStore.getState().setJustTransitionedFromWelcome(false);
    }, 550);
    return () => clearTimeout(id);
  }, [justTransitionedFromWelcome]);

  // ── Theme bootstrap (runs once) ──
  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const effective = (saved || "light") === "system" ? system : (saved || "light");
    document.documentElement.classList.toggle("dark", effective === "dark");

    // Restore color theme — Exxat One default: lavender
    const savedColor = localStorage.getItem("colorTheme");
    let colorToApply = savedColor || "lavender";
    if (!localStorage.getItem("colorThemeMigrated") && savedColor === "rose") {
      colorToApply = "lavender";
      localStorage.setItem("colorTheme", "lavender");
      localStorage.setItem("colorThemeMigrated", "1");
    }
    document.documentElement.classList.remove("theme-lavender", "theme-sage", "theme-rose");
    document.documentElement.classList.add(`theme-${colorToApply}`);

    // Restore density (sync effect will set data-density on html)
    // Default to comfortable; user can choose compact via Appearance menu if desired
    const savedDensity = localStorage.getItem("density") as "comfortable" | "compact" | null;
    if (savedDensity === "compact") {
      useAppStore.getState().setDensity("compact");
    } else if (savedDensity === "comfortable") {
      useAppStore.getState().setDensity("comfortable");
    }

    // Restore high contrast mode
    const savedContrast = localStorage.getItem("contrast");
    if (savedContrast === "high") {
      document.documentElement.setAttribute("data-contrast", "high");
    } else if (savedContrast === "default") {
      document.documentElement.setAttribute("data-contrast", "off");
    }

    // Restore product switcher approach (guards against HMR store cache miss)
    const validApproaches = ["logo-area", "icon-next-to-help", "logo-chevron", "banner-ver", "banner-top", "header-and-banner", "header-and-banner-inline", "greeting-popover"] as const;
    type Approach = typeof validApproaches[number];
    const savedApproach = localStorage.getItem("productSwitcherApproach");
    if (savedApproach && (validApproaches as readonly string[]).includes(savedApproach)) {
      useAppStore.getState().setProductSwitcherApproach(savedApproach as Approach);
    }
  }, []);

  // ── Navigation handler — wraps in startTransition for non-blocking page switch ──
  const handleNavigation = React.useCallback(
    (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => {
      startTransition(() => {
        actions.navigateToPage(page, options);
      });
    },
    [actions, startTransition]
  );

  // ── Render helpers ──

  const renderContent = () => {
    switch (currentPage) {
      case "Leo AI":
        return (
          <div className="min-w-0 overflow-clip bg-background text-foreground">
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 pt-4 pb-12 md:gap-6 md:pt-6 md:pb-16">
                  <React.Suspense fallback={<PageLoader />}>
                    <LazyLeoAIPage />
                  </React.Suspense>
                </div>
              </div>
            </div>
          </div>
        );

      case "Reports":
        return (
          <div className="min-w-0 overflow-x-auto overflow-y-auto bg-background text-foreground h-full flex flex-col">
            <React.Suspense fallback={<PageLoader />}>
              <LazyReportsPage />
            </React.Suspense>
          </div>
        );

      case "Slots":
        return (
          <div className="min-w-0 overflow-x-auto overflow-y-auto bg-background text-foreground h-full flex flex-col">
            <React.Suspense fallback={<PageLoader />}>
              <LazySlotsPage />
            </React.Suspense>
          </div>
        );

      case "Schedules":
        return (
          <div className="min-w-0 flex flex-1 flex-col min-h-0 overflow-hidden bg-background text-foreground">
            <React.Suspense fallback={<PageLoader />}>
              {selectedScheduleId ? (
                <LazyScheduleDetailPage />
              ) : (
                <LazySchedulePage />
              )}
            </React.Suspense>
          </div>
        );

      case "Requested":
        return (
          <div className="min-w-0 overflow-x-auto overflow-y-auto bg-background text-foreground h-full flex flex-col">
            <React.Suspense fallback={<PageLoader />}>
              <LazyRequestedSlotsPage />
            </React.Suspense>
          </div>
        );

      case "Approved":
        return (
          <div className="min-w-0 overflow-x-auto overflow-y-auto bg-background text-foreground h-full flex flex-col">
            <React.Suspense fallback={<PageLoader />}>
              <LazyApprovedSlotsPage />
            </React.Suspense>
          </div>
        );

      case "Saved":
        return (
          <div className="min-w-0 flex flex-1 flex-col min-h-0 overflow-hidden bg-background text-foreground" />
        );

      case "Design System":
        return (
          <div className="min-w-0 overflow-x-auto overflow-y-auto bg-background text-foreground h-full flex flex-col">
            <React.Suspense fallback={<PageLoader />}>
              <LazyDesignSystemPage />
            </React.Suspense>
          </div>
        );

      case "Internship":
        return (
          <div className="min-w-0 flex flex-1 flex-col min-h-0 overflow-auto bg-background text-foreground">
            <InternshipPage />
          </div>
        );

      case "Jobs":
        return (
          <div className="min-w-0 flex flex-1 flex-col min-h-0 overflow-hidden bg-background text-foreground">
            {selectedJobId ? (
              <JobDetailPage />
            ) : showJobListFull ? (
              <JobListPage />
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <JobsPage />
              </div>
            )}
          </div>
        );

      case "Browse":
        return (
          <div className="min-w-0 overflow-clip bg-background text-foreground">
            <div className="flex flex-1 items-center justify-center min-h-[400px] p-8">
              <p className="text-muted-foreground">Browse available slots and opportunities. Coming soon.</p>
            </div>
          </div>
        );

      case "People":
        return (
          <div className="min-w-0 overflow-clip bg-background text-foreground">
            <div className="flex flex-1 items-center justify-center min-h-[400px] p-8">
              <p className="text-muted-foreground">People roster and reference records. Coming soon.</p>
            </div>
          </div>
        );

      case "Organizations":
        return (
          <div className="min-w-0 overflow-clip bg-background text-foreground">
            <div className="flex flex-1 items-center justify-center min-h-[400px] p-8">
              <p className="text-muted-foreground">Partner and organization management. Coming soon.</p>
            </div>
          </div>
        );

      case "Home":
      default:
        if (!hasSeenWelcome) {
          return <WelcomePage />;
        }
        const isHeaderBannerInline = productSwitcherApproach === "header-and-banner-inline";
        const isBannerTop = productSwitcherApproach === "banner-top";
        const isGreetingPopover = productSwitcherApproach === "greeting-popover";
        const showBanner =
          (productSwitcherApproach === "banner-ver" ||
            productSwitcherApproach === "header-and-banner" ||
            isHeaderBannerInline ||
            isBannerTop ||
            isGreetingPopover) &&
          !hiddenHomeSections.includes("exxat-prism-banner");

        return (
          <div className="min-w-0 min-h-0 bg-background text-foreground flex flex-1 flex-col">
            {isBannerTop && showBanner && <HomeExxatPrismBanner variant="top" />}
            <div className="min-w-0 min-h-0 flex flex-1 flex-col p-4 md:p-6">
            <div className="content-rail @container/main flex flex-1 flex-col gap-6 w-full">
              <header className="pt-4 md:pt-6 pb-6">
                {isHeaderBannerInline ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 pb-4">
                    <h1 className="page-title text-left shrink-0">
                      Hi, {sidebarData.user.name}
                    </h1>
                    {showBanner && (
                      <div className="sm:ml-auto shrink-0">
                        <HomeExxatPrismBanner variant="concise" />
                      </div>
                    )}
                  </div>
                ) : isGreetingPopover ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 pb-4">
                    <h1 className="page-title text-left shrink-0">
                      Hi, {sidebarData.user.name}
                    </h1>
                    {showBanner && (
                      <div className="sm:ml-auto shrink-0">
                        <HomeExxatPrismBanner variant="concise" />
                      </div>
                    )}
                  </div>
                ) : (
                  <h1 className="page-title text-center pt-4 pb-4">
                    Hi, {sidebarData.user.name}
                  </h1>
                )}
              </header>
              <div className="home-sections-gap flex flex-col">
                {!hiddenHomeSections.includes("cards") && <HomeCards />}
                {showBanner && !isHeaderBannerInline && !isBannerTop && !isGreetingPopover && <HomeExxatPrismBanner />}
                {!hiddenHomeSections.includes("todo") && <HomeTodoSection />}
                {!hiddenHomeSections.includes("quick-access") && <HomeQuickAccessSection />}
                {!hiddenHomeSections.includes("career-opportunities") && (
                  <SectionWithHeader
                    title="Career Opportunities"
                    description="Placement schedules, jobs, and career resources"
                    titleId="section-promo"
                    className="!px-0"
                  >
                    <HomePromoSection />
                  </SectionWithHeader>
                )}
                {!hiddenHomeSections.includes("career") && <HomeCareerSection />}
                {!hiddenHomeSections.includes("career-journey") && <HomeCareerJourneySection />}
              </div>
            </div>
            </div>
          </div>
        );
    }
  };

  const AppLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <React.Suspense fallback={<AppLoader />}>
      <LazyChatProvider>
        <TooltipProvider delayDuration={300}>
          <AppUrlSync>
          <div className="flex flex-col h-screen bg-sidebar has-data-[variant=inset]:bg-sidebar">
            {/* Skip link — WCAG 2.4.1 Bypass Blocks (Level A) */}
            <a
              href="#main-content"
              className="skip-to-content"
            >
              Skip to main content
            </a>
            <TopSidebar
              currentPage={currentPage}
              jobsTab={jobsTab}
              scheduleTab={scheduleTab === "wishlist" ? "wishlist" : "schedule"}
              onNavigationChange={handleNavigation}
              isWelcomePage={!hasSeenWelcome && currentPage === "Home"}
              animateFromWelcome={justTransitionedFromWelcome}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Peer element — hidden on Welcome page to avoid card styling */}
              {hasSeenWelcome && <div data-variant="inset" className="peer size-0 overflow-hidden" aria-hidden />}
              <SidebarInset
                  id="main-content"
                  tabIndex={-1}
                  className={cn(
                    "relative z-[50] min-w-0 flex-1 w-full overflow-x-auto overflow-y-auto h-full transition-all duration-300",
                    !hasSeenWelcome && currentPage === "Home"
                      ? "bg-sidebar text-sidebar-foreground border-0 rounded-none shadow-none m-0"
                      : "bg-background text-foreground border border-border/40 rounded-2xl shadow-sm md:m-2",
                    justTransitionedFromWelcome && "home-slide-up-from-bottom"
                  )}
                  style={!hasSeenWelcome && currentPage === "Home" ? undefined : (profileSettingsOpen || applyJobModalMarginActive) ? { marginLeft: "2rem", marginRight: "2rem", marginBottom: "2rem" } : undefined}
                >
                <ErrorBoundary>
                  <div className={`flex flex-col h-full w-full min-w-0 overflow-x-auto overflow-y-auto${isPending ? " opacity-80 transition-opacity duration-150" : ""}`}>
                    {renderContent()}
                  </div>
                </ErrorBoundary>
              </SidebarInset>
            </div>

          {/* Leo AI Panel — lazy loaded */}
          {showLeoPanel && (
            <React.Suspense fallback={null}>
              <LazyLeoPanel
                isOpen={showLeoPanel}
                onClose={actions.toggleLeoPanel}
                pageContext={leoPanelContext}
              />
            </React.Suspense>
          )}
          </div>
          </AppUrlSync>
        </TooltipProvider>
      </LazyChatProvider>
    </React.Suspense>
  );
}

export default App;