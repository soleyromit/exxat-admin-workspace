import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Badge } from "../ui/badge";
import { registry } from "../../design-system/registry";
import { useAppStore } from "../../stores/app-store";

// Lazy-load each heavy tab to keep initial paint fast
const LazyFoundationTab = React.lazy(() =>
  import("./design-system/foundation-tab").then(m => ({ default: m.FoundationTab }))
);
const LazyComponentsTab = React.lazy(() =>
  import("./design-system/components-tab").then(m => ({ default: m.ComponentsTab }))
);
const LazyCompositesTab = React.lazy(() =>
  import("./design-system/composites-tab").then(m => ({ default: m.CompositesTab }))
);
const LazyPatternsTab = React.lazy(() =>
  import("./design-system/patterns-tab").then(m => ({ default: m.PatternsTab }))
);
const LazyPromptsTab = React.lazy(() =>
  import("./design-system/prompts-tab").then(m => ({ default: m.PromptsTab }))
);

const TabLoader = () => (
  <div className="flex flex-1 items-center justify-center min-h-[300px]">
    <div className="animate-pulse space-y-4 w-full max-w-2xl px-8">
      <div className="h-8 bg-muted rounded-lg w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
      </div>
    </div>
  </div>
);

const tabs = [
  { id: "foundation", label: "Foundation", icon: "palette" as const, description: "Colors, typography, spacing, radius, shadows" },
  { id: "components", label: "Components", icon: "kanban" as const, description: "UI primitives — Button, Badge, Card, Input, Dialog..." },
  { id: "composites", label: "Composites", icon: "layer-group" as const, description: "Business components — MetricCard, DataTable, FilterBar..." },
  { id: "patterns", label: "Patterns", icon: "grid3x3" as const, description: "Page templates, layouts, scroll behavior, rules" },
  { id: "prompts", label: "Prompt Library", icon: "sparkles" as const, description: "AI-ready prompts for PMs and designers" },
];

export function DesignSystemPage() {
  const storeTab = useAppStore((s) => s.designSystemTab);
  const storeSection = useAppStore((s) => s.designSystemSection);
  const [activeTab, setActiveTab] = React.useState(storeTab);

  // Sync with sidebar panel navigation
  React.useEffect(() => {
    setActiveTab(storeTab);
  }, [storeTab]);

  // Scroll to section when navigating from sidebar panel (e.g. Components > Button)
  React.useEffect(() => {
    if (!storeSection) return;
    const el = document.getElementById(storeSection);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [storeTab, storeSection]);

  const primitiveCount = registry.filter(c => c.category === "primitive").length;
  const compositeCount = registry.filter(c => c.category === "composite").length;
  const templateCount = registry.filter(c => c.category === "template").length;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Hero header ── */}
      <div className="border-b bg-gradient-to-br from-background via-muted/20 to-muted/40 px-4 lg:px-6 py-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  v2.1
                </Badge>
                <Badge variant="outline" className="text-xs">
                  AI-Ready
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Exxat One Design System</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Living component library and AI prompt hub. Browse components, copy usage code, and generate design-system-correct UI from natural language prompts.
              </p>
            </div>
            <div className="flex-shrink-0 hidden md:block">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Primitives", value: primitiveCount },
                  { label: "Composites", value: compositeCount },
                  { label: "Templates", value: templateCount },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border bg-background px-4 py-2">
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="border-b bg-background px-4 lg:px-6">
          <div className="max-w-7xl mx-auto w-full">
            <TabsList className="flex-nowrap h-auto bg-transparent p-0 gap-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
                >
                  <FontAwesomeIcon
                    name={tab.icon}
                    weight={activeTab === tab.id ? "solid" : "regular"}
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {tab.label}
                  {tab.id === "prompts" && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 ml-0.5 h-4">AI</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ── Tab contents ── */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="foundation" className="mt-0 h-full">
            <React.Suspense fallback={<TabLoader />}>
              <LazyFoundationTab />
            </React.Suspense>
          </TabsContent>
          <TabsContent value="components" className="mt-0 h-full">
            <React.Suspense fallback={<TabLoader />}>
              <LazyComponentsTab />
            </React.Suspense>
          </TabsContent>
          <TabsContent value="composites" className="mt-0 h-full">
            <React.Suspense fallback={<TabLoader />}>
              <LazyCompositesTab />
            </React.Suspense>
          </TabsContent>
          <TabsContent value="patterns" className="mt-0 h-full">
            <React.Suspense fallback={<TabLoader />}>
              <LazyPatternsTab />
            </React.Suspense>
          </TabsContent>
          <TabsContent value="prompts" className="mt-0 h-full">
            <React.Suspense fallback={<TabLoader />}>
              <LazyPromptsTab />
            </React.Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
