/**
 * Exxat One Design System — Component Registry
 *
 * Machine-readable catalog of all design system components.
 * Used by: Design System showcase page, CLAUDE.md, AI coding assistants.
 *
 * How AI tools should use this:
 *   import { registry, findComponents } from "@/design-system/registry"
 *   const tableComponents = findComponents({ tags: ["table"] })
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PropDef {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface VariantDef {
  name: string;
  value: string;
  description: string;
}

export interface ExampleDef {
  title: string;
  description?: string;
  code: string;
}

export interface ComponentEntry {
  id: string;
  name: string;
  category: "primitive" | "composite" | "layout" | "template";
  subcategory?: string;
  description: string;
  filePath: string;
  importPath: string;
  props: PropDef[];
  variants?: VariantDef[];
  examples: ExampleDef[];
  tags: string[];
  relatedComponents?: string[];
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const registry: ComponentEntry[] = [

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Actions
  // ════════════════════════════════════════════════════════════════

  {
    id: "button",
    name: "Button",
    category: "primitive",
    subcategory: "actions",
    description: "Primary interactive element. Default for primary CTAs, outline for secondary, ghost for tertiary, destructive for delete actions.",
    filePath: "src/components/ui/button.tsx",
    importPath: "@/components/ui/button",
    props: [
      { name: "variant", type: '"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"', required: false, default: '"default"', description: "Visual style variant" },
      { name: "size", type: '"default" | "sm" | "lg" | "icon" | "touch" | "icon-touch"', required: false, default: '"default"', description: "Size: default, sm (responsive: min-h-11 on mobile), lg, icon (responsive: 44px on mobile), touch (min 44px), icon-touch (44×44 icon)" },
      { name: "asChild", type: "boolean", required: false, default: "false", description: "Render as a child element (e.g. <a> tag)" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disables the button" },
    ],
    variants: [
      { name: "default", value: "default", description: "Brand-colored. Use for primary CTAs." },
      { name: "outline", value: "outline", description: "Bordered. Use for secondary actions." },
      { name: "secondary", value: "secondary", description: "Muted. Use for supporting actions." },
      { name: "ghost", value: "ghost", description: "No border/bg. Use for tertiary or icon-only actions." },
      { name: "destructive", value: "destructive", description: "Red. Use only for irreversible delete/remove actions." },
      { name: "link", value: "link", description: "Underlined text. Use for inline navigation." },
    ],
    examples: [
      {
        title: "Primary CTA",
        code: `<Button>Save Changes</Button>`,
      },
      {
        title: "Secondary + Icon",
        code: `import { Download } from "lucide-react"\n\n<Button variant="outline">\n  <Download />\n  Export\n</Button>`,
      },
      {
        title: "Destructive",
        code: `<Button variant="destructive">Delete Record</Button>`,
      },
      {
        title: "Icon-only with tooltip",
        code: `<Button variant="ghost" size="icon" aria-label="Filter">\n  <FontAwesomeIcon name="filter" className="h-4 w-4" aria-hidden="true" />\n</Button>`,
      },
      {
        title: "Size variants",
        code: `<Button size="sm">Small</Button>\n<Button>Default</Button>\n<Button size="lg">Large</Button>`,
      },
    ],
    tags: ["button", "cta", "action", "interactive", "click", "submit"],
    relatedComponents: ["badge"],
  },

  {
    id: "badge",
    name: "Badge",
    category: "primitive",
    subcategory: "actions",
    description: "Compact label for status, counts, and state indicators. Variants include default, secondary, destructive, outline plus custom NewBadge, BetaBadge, CountBadge.",
    filePath: "src/components/ui/badge.tsx",
    importPath: "@/components/ui/badge",
    props: [
      { name: "variant", type: '"default" | "secondary" | "destructive" | "outline"', required: false, default: '"default"', description: "Visual style" },
      { name: "withIcon", type: "boolean", required: false, default: "false", description: "Adds icon padding" },
      { name: "interactive", type: "boolean", required: false, default: "false", description: "Adds hover state for clickable badges" },
    ],
    variants: [
      { name: "default", value: "default", description: "Brand-colored. Use for active states." },
      { name: "secondary", value: "secondary", description: "Muted. Use for neutral statuses." },
      { name: "destructive", value: "destructive", description: "Red. Use for error/overdue states." },
      { name: "outline", value: "outline", description: "Bordered. Use for non-critical labels." },
    ],
    examples: [
      {
        title: "Status badges",
        code: `import { Badge } from "@/components/ui/badge"\n\n<Badge>Active</Badge>\n<Badge variant="secondary">Pending</Badge>\n<Badge variant="destructive">Overdue</Badge>\n<Badge variant="outline">Draft</Badge>`,
      },
      {
        title: "Count badge (sidebar notification dot)",
        code: `import { CountBadge, NewBadge, BetaBadge } from "@/components/ui/badge"\n\n<CountBadge>24</CountBadge>\n<NewBadge />\n<BetaBadge />`,
      },
    ],
    tags: ["badge", "status", "label", "count", "indicator", "tag", "pill"],
    relatedComponents: ["button"],
  },

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Inputs & Forms
  // ════════════════════════════════════════════════════════════════

  {
    id: "input",
    name: "Input",
    category: "primitive",
    subcategory: "forms",
    description: "Standard text input. Always pair with a Label. Use placeholder for hints, not as a label replacement.",
    filePath: "src/components/ui/input.tsx",
    importPath: "@/components/ui/input",
    props: [
      { name: "type", type: "string", required: false, default: '"text"', description: "HTML input type" },
      { name: "placeholder", type: "string", required: false, description: "Hint text (not a label replacement)" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disables the input" },
    ],
    examples: [
      {
        title: "Labeled input",
        code: `import { Label } from "@/components/ui/label"\nimport { Input } from "@/components/ui/input"\n\n<div className="flex flex-col gap-1.5">\n  <Label htmlFor="email">Email address</Label>\n  <Input id="email" type="email" placeholder="you@example.com" />\n</div>`,
      },
    ],
    tags: ["input", "text", "form", "field", "search", "email"],
    relatedComponents: ["label", "form"],
  },

  {
    id: "select",
    name: "Select",
    category: "primitive",
    subcategory: "forms",
    description: "Dropdown selection for choosing one option from a list. Built on Radix UI for full accessibility.",
    filePath: "src/components/ui/select.tsx",
    importPath: "@/components/ui/select",
    props: [
      { name: "value", type: "string", required: false, description: "Controlled selected value" },
      { name: "onValueChange", type: "(value: string) => void", required: false, description: "Change handler" },
      { name: "placeholder", type: "string", required: false, description: "Placeholder shown when nothing selected" },
    ],
    examples: [
      {
        title: "Program selector",
        code: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"\n\n<Select>\n  <SelectTrigger aria-label="Select program">\n    <SelectValue placeholder="Select program" />\n  </SelectTrigger>\n  <SelectContent>\n    <SelectItem value="pt">Physical Therapy</SelectItem>\n    <SelectItem value="nursing">Nursing</SelectItem>\n    <SelectItem value="ot">Occupational Therapy</SelectItem>\n  </SelectContent>\n</Select>`,
      },
    ],
    tags: ["select", "dropdown", "form", "choice", "filter", "program"],
    relatedComponents: ["input", "label"],
  },

  {
    id: "checkbox",
    name: "Checkbox",
    category: "primitive",
    subcategory: "forms",
    description: "Boolean toggle for multi-select scenarios. Used in DataTable for row selection.",
    filePath: "src/components/ui/checkbox.tsx",
    importPath: "@/components/ui/checkbox",
    props: [
      { name: "checked", type: "boolean | 'indeterminate'", required: false, description: "Checked state. 'indeterminate' shows a dash for partial selection." },
      { name: "onCheckedChange", type: "(checked: boolean) => void", required: false, description: "Change handler" },
    ],
    examples: [
      {
        title: "Row selection checkbox",
        code: `import { Checkbox } from "@/components/ui/checkbox"\n\n<Checkbox\n  checked={row.getIsSelected()}\n  onCheckedChange={(v) => row.toggleSelected(!!v)}\n  aria-label="Select row"\n/>`,
      },
    ],
    tags: ["checkbox", "check", "selection", "form", "boolean", "multi-select"],
  },

  {
    id: "switch",
    name: "Switch",
    category: "primitive",
    subcategory: "forms",
    description: "Toggle between two states (on/off). Prefer over checkbox for settings and live-update toggles.",
    filePath: "src/components/ui/switch.tsx",
    importPath: "@/components/ui/switch",
    props: [
      { name: "checked", type: "boolean", required: false, description: "Controlled state" },
      { name: "onCheckedChange", type: "(checked: boolean) => void", required: false, description: "Change handler" },
    ],
    examples: [
      {
        title: "Settings toggle",
        code: `import { Switch } from "@/components/ui/switch"\nimport { Label } from "@/components/ui/label"\n\n<div className="flex items-center gap-2">\n  <Switch id="notifications" />\n  <Label htmlFor="notifications">Email notifications</Label>\n</div>`,
      },
    ],
    tags: ["switch", "toggle", "settings", "boolean", "on-off"],
  },

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Display
  // ════════════════════════════════════════════════════════════════

  {
    id: "card",
    name: "Card",
    category: "primitive",
    subcategory: "display",
    description: "Container for grouping related content. Use CardHeader + CardContent + CardFooter for structured layout. Supports @container queries for responsive card internals.",
    filePath: "src/components/ui/card.tsx",
    importPath: "@/components/ui/card",
    props: [
      { name: "className", type: "string", required: false, description: "Additional Tailwind classes. Use rounded-xl border for standard cards." },
    ],
    examples: [
      {
        title: "Standard content card",
        code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"\n\n<Card className="rounded-xl border">\n  <CardHeader>\n    <CardTitle>Student Overview</CardTitle>\n    <CardDescription>Current placement status</CardDescription>\n  </CardHeader>\n  <CardContent>\n    <p className="text-sm text-muted-foreground">Content goes here</p>\n  </CardContent>\n</Card>`,
      },
      {
        title: "Card with action",
        code: `import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card"\n\n<Card>\n  <CardHeader>\n    <CardTitle>Placements</CardTitle>\n    <CardAction>\n      <Button variant="ghost" size="icon"><MoreHorizontal /></Button>\n    </CardAction>\n  </CardHeader>\n  <CardContent>...</CardContent>\n</Card>`,
      },
    ],
    tags: ["card", "container", "panel", "surface", "group", "section"],
    relatedComponents: ["section-with-header", "metric-card"],
  },

  {
    id: "avatar",
    name: "Avatar",
    category: "primitive",
    subcategory: "display",
    description: "User profile image with automatic fallback to initials.",
    filePath: "src/components/ui/avatar.tsx",
    importPath: "@/components/ui/avatar",
    props: [
      { name: "src", type: "string", required: false, description: "Image URL" },
      { name: "alt", type: "string", required: false, description: "Alt text for accessibility" },
    ],
    examples: [
      {
        title: "Avatar with fallback",
        code: `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"\n\n<Avatar>\n  <AvatarImage src={user.avatar} alt={user.name} />\n  <AvatarFallback>SJ</AvatarFallback>\n</Avatar>`,
      },
    ],
    tags: ["avatar", "profile", "user", "image", "photo"],
  },

  {
    id: "skeleton",
    name: "Skeleton",
    category: "primitive",
    subcategory: "display",
    description: "Loading placeholder that matches the shape of the content it replaces. Use in Suspense fallbacks.",
    filePath: "src/components/ui/skeleton.tsx",
    importPath: "@/components/ui/skeleton",
    props: [
      { name: "className", type: "string", required: false, description: "Set dimensions to match the real content shape." },
    ],
    examples: [
      {
        title: "Card skeleton loader",
        code: `import { Skeleton } from "@/components/ui/skeleton"\n\n<div className="flex flex-col gap-3">\n  <Skeleton className="h-8 w-1/3 rounded-lg" />\n  <Skeleton className="h-4 w-2/3 rounded" />\n  <Skeleton className="h-48 w-full rounded-xl" />\n</div>`,
      },
    ],
    tags: ["skeleton", "loading", "placeholder", "shimmer", "spinner"],
  },

  {
    id: "separator",
    name: "Separator",
    category: "primitive",
    subcategory: "display",
    description: "Horizontal or vertical divider line. Prefer spacing/padding gaps over excessive separators.",
    filePath: "src/components/ui/separator.tsx",
    importPath: "@/components/ui/separator",
    props: [
      { name: "orientation", type: '"horizontal" | "vertical"', required: false, default: '"horizontal"', description: "Line direction" },
    ],
    examples: [
      { title: "Section divider", code: `import { Separator } from "@/components/ui/separator"\n\n<Separator className="my-4" />` },
    ],
    tags: ["separator", "divider", "hr", "line"],
  },

  {
    id: "progress",
    name: "Progress",
    category: "primitive",
    subcategory: "display",
    description: "Linear progress bar for showing completion percentage.",
    filePath: "src/components/ui/progress.tsx",
    importPath: "@/components/ui/progress",
    props: [
      { name: "value", type: "number", required: false, description: "Percentage (0–100)" },
    ],
    examples: [
      { title: "Compliance progress", code: `import { Progress } from "@/components/ui/progress"\n\n<Progress value={72} aria-label="Compliance completion" />` },
    ],
    tags: ["progress", "bar", "completion", "percentage", "compliance"],
  },

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Feedback
  // ════════════════════════════════════════════════════════════════

  {
    id: "alert",
    name: "Alert",
    category: "primitive",
    subcategory: "feedback",
    description: "Inline notification for important contextual messages. Not for toast notifications (use Sonner for those).",
    filePath: "src/components/ui/alert.tsx",
    importPath: "@/components/ui/alert",
    props: [
      { name: "variant", type: '"default" | "destructive"', required: false, default: '"default"', description: "Default for info, destructive for errors." },
    ],
    examples: [
      {
        title: "Warning alert",
        code: `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"\nimport { AlertTriangle } from "lucide-react"\n\n<Alert variant="destructive">\n  <AlertTriangle className="h-4 w-4" />\n  <AlertTitle>Action Required</AlertTitle>\n  <AlertDescription>15 schedules need confirmation before Friday.</AlertDescription>\n</Alert>`,
      },
    ],
    tags: ["alert", "warning", "error", "notification", "message", "info"],
  },

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Navigation
  // ════════════════════════════════════════════════════════════════

  {
    id: "tabs",
    name: "Tabs",
    category: "primitive",
    subcategory: "navigation",
    description: "Tab navigation within a page. Use for switching between status filters (Requested/Approved/Completed) or view types. Always use flex-nowrap for horizontal scroll on many tabs.",
    filePath: "src/components/ui/tabs.tsx",
    importPath: "@/components/ui/tabs",
    props: [
      { name: "value", type: "string", required: false, description: "Controlled active tab" },
      { name: "onValueChange", type: "(value: string) => void", required: false, description: "Tab change handler" },
      { name: "defaultValue", type: "string", required: false, description: "Initial active tab (uncontrolled)" },
    ],
    examples: [
      {
        title: "Status filter tabs",
        code: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"\n\n<Tabs value={activeTab} onValueChange={setActiveTab}>\n  <TabsList className="flex-nowrap">\n    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>\n    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>\n    <TabsTrigger value="completed">Completed</TabsTrigger>\n  </TabsList>\n  <TabsContent value="upcoming">...</TabsContent>\n  <TabsContent value="ongoing">...</TabsContent>\n  <TabsContent value="completed">...</TabsContent>\n</Tabs>`,
      },
    ],
    tags: ["tabs", "navigation", "filter", "view", "switch", "toggle"],
  },

  {
    id: "pagination",
    name: "Pagination",
    category: "primitive",
    subcategory: "navigation",
    description: "Page navigation for large data sets. DataTable has built-in pagination — use this standalone for custom pagination needs.",
    filePath: "src/components/ui/pagination.tsx",
    importPath: "@/components/ui/pagination",
    props: [
      { name: "currentPage", type: "number", required: true, description: "1-indexed current page" },
      { name: "totalPages", type: "number", required: true, description: "Total number of pages" },
      { name: "onPageChange", type: "(page: number) => void", required: true, description: "Page change handler" },
    ],
    examples: [
      { title: "Basic pagination", code: `import { Pagination } from "@/components/ui/pagination"\n\n<Pagination currentPage={page} totalPages={20} onPageChange={setPage} />` },
    ],
    tags: ["pagination", "paging", "navigation", "table", "list"],
  },

  // ════════════════════════════════════════════════════════════════
  // PRIMITIVES — Overlays
  // ════════════════════════════════════════════════════════════════

  {
    id: "dialog",
    name: "Dialog",
    category: "primitive",
    subcategory: "overlays",
    description: "Modal dialog for forms, confirmations, and focused tasks. Blocks background interaction.",
    filePath: "src/components/ui/dialog.tsx",
    importPath: "@/components/ui/dialog",
    props: [
      { name: "open", type: "boolean", required: false, description: "Controlled open state" },
      { name: "onOpenChange", type: "(open: boolean) => void", required: false, description: "Open state change handler" },
    ],
    examples: [
      {
        title: "Confirmation dialog",
        code: `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"\n\n<Dialog open={open} onOpenChange={setOpen}>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>Confirm Approval</DialogTitle>\n      <DialogDescription>This will approve all selected slots.</DialogDescription>\n    </DialogHeader>\n    <DialogFooter>\n      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>\n      <Button onClick={handleConfirm}>Approve</Button>\n    </DialogFooter>\n  </DialogContent>\n</Dialog>`,
      },
    ],
    tags: ["dialog", "modal", "popup", "overlay", "confirm", "form"],
  },

  {
    id: "drawer",
    name: "Drawer",
    category: "composite",
    subcategory: "overlays",
    description: "Reusable side panel / sheet with size variants (sm, md, lg, xl, full). Use for View Settings, filters, detail panels.",
    filePath: "src/components/shared/drawer.tsx",
    importPath: "@/components/shared/drawer",
    props: [
      { name: "open", type: "boolean", required: false, description: "Controlled open state" },
      { name: "onOpenChange", type: "(open: boolean) => void", required: false, description: "Open state change handler" },
      { name: "trigger", type: "React.ReactNode", required: false, description: "Element that opens the drawer (e.g. Button)" },
      { name: "title", type: "React.ReactNode", required: false, description: "Simple title in header" },
      { name: "header", type: "React.ReactNode", required: false, description: "Custom header (overrides title)" },
      { name: "size", type: '"sm" | "md" | "lg" | "xl" | "full"', required: false, default: '"md"', description: "Size: sm (320px), md, lg, xl, full" },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', required: false, default: '"right"', description: "Side from which drawer slides" },
      { name: "modal", type: "boolean", required: false, default: "true", description: "Set false when drawer contains dropdowns" },
    ],
    examples: [
      {
        title: "View Settings drawer",
        code: `import { Drawer } from "@/components/shared/drawer"\n\n<Drawer\n  open={isOpen}\n  onOpenChange={setIsOpen}\n  trigger={<Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>}\n  header={<span className="text-xl font-semibold">View Settings</span>}\n  size="md"\n  side="right"\n  modal={false}\n>\n  <div className="flex-1 min-h-0 overflow-y-auto">...</div>\n</Drawer>`,
      },
    ],
    tags: ["drawer", "sheet", "panel", "sidebar", "overlay", "settings"],
  },

  {
    id: "tooltip",
    name: "Tooltip",
    category: "primitive",
    subcategory: "overlays",
    description: "Brief contextual hint on hover. Use for icon-only buttons or truncated content.",
    filePath: "src/components/ui/tooltip.tsx",
    importPath: "@/components/ui/tooltip",
    props: [
      { name: "content", type: "React.ReactNode", required: true, description: "Tooltip text or content" },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', required: false, default: '"top"', description: "Where the tooltip appears" },
    ],
    examples: [
      {
        title: "Icon button with tooltip",
        code: `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"\n\n<TooltipProvider>\n  <Tooltip>\n    <TooltipTrigger asChild>\n      <Button variant="ghost" size="icon" aria-label="Export data">\n        <Download className="h-4 w-4" aria-hidden="true" />\n      </Button>\n    </TooltipTrigger>\n    <TooltipContent>Export data</TooltipContent>\n  </Tooltip>\n</TooltipProvider>`,
      },
    ],
    tags: ["tooltip", "hint", "hover", "popover", "label"],
  },

  {
    id: "dropdown-menu",
    name: "DropdownMenu",
    category: "primitive",
    subcategory: "overlays",
    description: "Contextual menu triggered by a button. Use for action menus, bulk actions, and option lists.",
    filePath: "src/components/ui/dropdown-menu.tsx",
    importPath: "@/components/ui/dropdown-menu",
    props: [],
    examples: [
      {
        title: "Row actions menu",
        code: `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"\n\n<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <Button variant="ghost" size="icon" aria-label="Row actions">\n      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />\n    </Button>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent align="end">\n    <DropdownMenuItem>View details</DropdownMenuItem>\n    <DropdownMenuItem>Edit record</DropdownMenuItem>\n    <DropdownMenuSeparator />\n    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`,
      },
    ],
    tags: ["dropdown", "menu", "actions", "context", "options", "popover"],
  },

  // ════════════════════════════════════════════════════════════════
  // COMPOSITES — Metrics
  // ════════════════════════════════════════════════════════════════

  {
    id: "metric-card",
    name: "MetricCard",
    category: "composite",
    subcategory: "metrics",
    description: "Displays a single KPI with title, value, trend, and optional icon. Use inside KeyMetricsShowcase for full-width dashboards or inside page headers for compact metrics.",
    filePath: "src/components/shared/metric-card.tsx",
    importPath: "@/components/shared/metric-card",
    props: [
      { name: "data", type: "MetricCardData", required: true, description: "Metric data object" },
      { name: "onClick", type: "() => void", required: false, description: "Makes the card clickable for drill-down" },
      { name: "className", type: "string", required: false, description: "Additional classes" },
    ],
    examples: [
      {
        title: "KPI metric card",
        code: `import { MetricCard } from "@/components/shared/metric-card"\n\n<MetricCard\n  data={{\n    title: "Active Placements",\n    value: "247",\n    change: "+12%",\n    trend: "up",\n    description: "vs last semester",\n    icon: "calendar",\n  }}\n/>`,
      },
    ],
    tags: ["metric", "kpi", "card", "stat", "number", "data", "chart"],
    relatedComponents: ["key-metrics-showcase", "simple-metric"],
  },

  {
    id: "key-metrics-showcase",
    name: "KeyMetricsShowcase",
    category: "composite",
    subcategory: "metrics",
    description: "Full-width metrics grid with gradient background. Use at the top of dashboard and list pages. Supports 1–6 columns with an optional insight banner below.",
    filePath: "src/components/shared/key-metrics-showcase.tsx",
    importPath: "@/components/shared/key-metrics-showcase",
    props: [
      { name: "metrics", type: "MetricCardData[]", required: true, description: "Array of metric objects to display" },
      { name: "insight", type: "InsightData", required: false, description: "Optional insight banner below the grid" },
      { name: "columns", type: "1 | 2 | 3 | 4 | 5 | 6", required: false, default: "4", description: "Grid columns" },
    ],
    examples: [
      {
        title: "Dashboard metrics row",
        code: `import { KeyMetricsShowcase } from "@/components/shared/key-metrics-showcase"\n\n<KeyMetricsShowcase\n  metrics={[\n    { title: "Total Students", value: "1,247", trend: "up", change: "+8%" },\n    { title: "Active Placements", value: "483", trend: "up", change: "+12%" },\n    { title: "Compliance Rate", value: "94%", trend: "up", change: "+2%" },\n    { title: "Pending Reviews", value: "23", trend: "down", change: "-5" },\n  ]}\n/>`,
      },
    ],
    tags: ["metrics", "kpi", "dashboard", "stats", "grid", "overview"],
    relatedComponents: ["metric-card"],
  },

  // ════════════════════════════════════════════════════════════════
  // COMPOSITES — Data Display
  // ════════════════════════════════════════════════════════════════

  {
    id: "data-table",
    name: "DataTable",
    category: "composite",
    subcategory: "data",
    description: "Feature-rich table with drag-and-drop column reordering, column pinning (left/right), resizing, sorting, multi-select with bulk actions, and pagination. The primary data display pattern for list pages.",
    filePath: "src/components/shared/data-table.tsx",
    importPath: "@/components/shared/data-table",
    props: [
      { name: "columns", type: "ColumnConfig[]", required: true, description: "Column definitions with visibility, pin, width, sort options" },
      { name: "data", type: "Record<string, unknown>[]", required: true, description: "Row data array" },
      { name: "onRowClick", type: "(row: Row) => void", required: false, description: "Row click handler for detail navigation" },
      { name: "selectedRows", type: "string[]", required: false, description: "Controlled multi-select row IDs" },
      { name: "onSelectionChange", type: "(ids: string[]) => void", required: false, description: "Selection change handler" },
      { name: "sortConfig", type: "SortConfig", required: false, description: "Sort column and direction" },
      { name: "pageSize", type: "number", required: false, default: "25", description: "Rows per page" },
    ],
    examples: [
      {
        title: "Student list table",
        code: `import { DataTable } from "@/components/shared/data-table"\n\nconst columns = [\n  { key: "name", label: "Student Name", icon: "user", isPinned: true, pinSide: "left", width: 180, isVisible: true },\n  { key: "program", label: "Program", icon: "graduation-cap", isPinned: false, width: 160, isVisible: true },\n  { key: "site", label: "Site", icon: "building", isPinned: false, width: 200, isVisible: true },\n  { key: "status", label: "Status", icon: "circle", isPinned: false, width: 120, isVisible: true },\n]\n\n<DataTable\n  columns={columns}\n  data={students}\n  onRowClick={(row) => navigateToDetail(row.id)}\n/>`,
      },
    ],
    tags: ["table", "data", "list", "grid", "sort", "filter", "pagination", "select", "drag"],
    relatedComponents: ["filter-bar", "primary-page-template"],
  },

  {
    id: "filter-bar",
    name: "FilterBar",
    category: "composite",
    subcategory: "data",
    description: "Dynamic filter chip UI for active filters. Shows applied filters as removable chips, 'Add Filter' dropdown for available filters. Used above DataTable in PrimaryPageTemplate.",
    filePath: "src/components/shared/filter-bar.tsx",
    importPath: "@/components/shared/filter-bar",
    props: [
      { name: "filters", type: "FilterConfig[]", required: true, description: "Available filter definitions with options" },
      { name: "activeFilters", type: "ActiveFilter[]", required: true, description: "Currently applied filters" },
      { name: "onFilterChange", type: "(filters: ActiveFilter[]) => void", required: true, description: "Filter state change handler" },
    ],
    examples: [
      {
        title: "Student list filters",
        code: `import { FilterBar } from "@/components/shared/filter-bar"\n\n<FilterBar\n  filters={[\n    { id: "status", label: "Status", options: ["Active", "Pending", "Completed"] },\n    { id: "program", label: "Program", options: ["PT", "Nursing", "OT"] },\n    { id: "site", label: "Site", options: siteNames },\n  ]}\n  activeFilters={activeFilters}\n  onFilterChange={setActiveFilters}\n/>`,
      },
    ],
    tags: ["filter", "search", "chips", "tags", "refinement", "table"],
    relatedComponents: ["data-table", "primary-page-template"],
  },

  {
    id: "calendar-view",
    name: "CalendarView",
    category: "composite",
    subcategory: "data",
    description: "Month/week calendar showing placement events. Events are color-coded by status (active/pending/full). Supports navigation between months.",
    filePath: "src/components/shared/calendar-view.tsx",
    importPath: "@/components/shared/calendar-view",
    props: [
      { name: "events", type: "CalendarEvent[]", required: false, description: "Events to display on the calendar" },
      { name: "onEventClick", type: "(event: CalendarEvent) => void", required: false, description: "Event click handler" },
    ],
    examples: [
      {
        title: "Placement calendar",
        code: `import { CalendarView } from "@/components/shared/calendar-view"\n\n<CalendarView\n  events={placementEvents.map(p => ({\n    id: p.id,\n    title: p.site,\n    date: p.startDate,\n    status: p.status,\n  }))}\n  onEventClick={(e) => navigateToDetail(e.id)}\n/>`,
      },
    ],
    tags: ["calendar", "schedule", "events", "date", "month", "week", "view"],
  },

  {
    id: "chart-area-interactive",
    name: "ChartAreaInteractive",
    category: "composite",
    subcategory: "data",
    description: "Stacked area chart (Recharts) with legend, tooltip, and 'Ask Leo' AI button. Shows trends over time for 3 data series.",
    filePath: "src/components/shared/chart-area-interactive.tsx",
    importPath: "@/components/shared/chart-area-interactive",
    props: [
      { name: "data", type: "ChartDataPoint[]", required: false, description: "Array of data points with date and values" },
      { name: "title", type: "string", required: false, description: "Chart title" },
    ],
    examples: [
      { title: "Placement trend chart", code: `import { ChartAreaInteractive } from "@/components/shared/chart-area-interactive"\n\n<ChartAreaInteractive\n  title="Placement Overview (90 days)"\n  data={placementTrendData}\n/>` },
    ],
    tags: ["chart", "graph", "area", "trend", "analytics", "recharts", "visualization"],
  },

  {
    id: "insight-card",
    name: "InsightCard",
    category: "composite",
    subcategory: "data",
    description: "Highlighted callout for AI-generated insights or important context banners below metric rows.",
    filePath: "src/components/shared/insight-card.tsx",
    importPath: "@/components/shared/insight-card",
    props: [
      { name: "insight", type: "string", required: true, description: "The insight text to display" },
      { name: "icon", type: "IconName", required: false, description: "FontAwesome icon name" },
      { name: "variant", type: '"default" | "success" | "warning"', required: false, default: '"default"', description: "Color variant" },
    ],
    examples: [
      { title: "AI insight banner", code: `import { InsightCard } from "@/components/shared/insight-card"\n\n<InsightCard\n  icon="lightbulb"\n  insight="Placement confirmations are 12% higher than last semester. Primary driver: earlier site outreach."\n/>` },
    ],
    tags: ["insight", "callout", "highlight", "ai", "summary", "banner"],
  },

  {
    id: "action-card",
    name: "ActionCard",
    category: "composite",
    subcategory: "data",
    description: "CTA card with icon, title, description, and primary action button. Use for empty states, onboarding prompts, and feature discovery.",
    filePath: "src/components/shared/action-card.tsx",
    importPath: "@/components/shared/action-card",
    props: [
      { name: "title", type: "string", required: true, description: "Card heading" },
      { name: "description", type: "string", required: false, description: "Supporting text" },
      { name: "icon", type: "IconName", required: false, description: "FontAwesome icon" },
      { name: "action", type: "{ label: string; onClick: () => void }", required: false, description: "Primary CTA" },
    ],
    examples: [
      {
        title: "Empty state card",
        code: `import { ActionCard } from "@/components/shared/action-card"\n\n<ActionCard\n  icon="calendar-plus"\n  title="No placements scheduled"\n  description="Request a slot to get started with your first placement."\n  action={{ label: "Request a Slot", onClick: () => navigateTo("Slots") }}\n/>`,
      },
    ],
    tags: ["action", "empty-state", "cta", "card", "onboarding", "prompt"],
  },

  {
    id: "todo-task-card",
    name: "TodoTaskCard",
    category: "composite",
    subcategory: "data",
    description: "Reusable task card for wishlist items (school preferences) or upcoming placements (site, address, specialty, shift). Supports action badges, due dates, and primary/secondary actions.",
    filePath: "src/components/shared/todo-task-card.tsx",
    importPath: "@/components/shared/todo-task-card",
    props: [
      { name: "taskType", type: "string", required: true, description: "Label (e.g. Wishlist, Internship)" },
      { name: "taskTypeIcon", type: '"briefcase" | "bookOpen" | "heart"', required: false, default: '"briefcase"', description: "Icon for task type" },
      { name: "title", type: "string", required: true, description: "Main title" },
      { name: "stage", type: '"upcoming" | "in progress"', required: true, description: "Task stage" },
      { name: "siteName", type: "string", required: false, description: "When set, shows site layout (logo + metadata)" },
    ],
    examples: [
      {
        title: "Wishlist card",
        code: `import { TodoTaskCard, type TodoTask } from "@/components/shared/todo-task-card"\n\n<TodoTaskCard\n  taskType="Wishlist"\n  taskTypeIcon="heart"\n  title="Spring 2025 Clinical Rotation"\n  stage="upcoming"\n  availabilities={80}\n  programType="Clinical PT Applications"\n  onViewInstructions={() => navigateToPage("Saved")}\n  onSharePreferences={() => navigateToPage("Saved")}\n/>`,
      },
      {
        title: "Upcoming placement card",
        code: `import { TodoCardList, type TodoTask } from "@/components/shared/todo-task-card"\n\nconst tasks: TodoTask[] = [...]\n<TodoCardList tasks={tasks} onTaskAction={() => navigateToPage("Internship")} />`,
      },
    ],
    tags: ["todo", "task", "card", "wishlist", "placement", "internship", "reusable"],
  },

  // ════════════════════════════════════════════════════════════════
  // COMPOSITES — Layout
  // ════════════════════════════════════════════════════════════════

  {
    id: "section-with-header",
    name: "SectionWithHeader",
    category: "composite",
    subcategory: "layout",
    description: "Reusable section container with title, optional description, and optional filter slot on the right. Use to wrap distinct content areas within a page.",
    filePath: "src/components/shared/section-with-header.tsx",
    importPath: "@/components/shared/section-with-header",
    props: [
      { name: "title", type: "string", required: true, description: "Section heading" },
      { name: "description", type: "string", required: false, description: "Optional subheading" },
      { name: "filter", type: "React.ReactNode", required: false, description: "Optional filter/action on the right side of the header" },
      { name: "children", type: "React.ReactNode", required: true, description: "Section content" },
    ],
    examples: [
      {
        title: "Section with optional filter",
        code: `import { SectionWithHeader } from "@/components/shared/section-with-header"\n\n<SectionWithHeader\n  title="Placement Pipeline"\n  description="Track placement status across all active students"\n  filter={\n    <Select value={range} onValueChange={setRange}>\n      <SelectTrigger className="w-32 h-8">\n        <SelectValue />\n      </SelectTrigger>\n      <SelectContent>\n        <SelectItem value="30d">Last 30 days</SelectItem>\n        <SelectItem value="90d">Last 90 days</SelectItem>\n      </SelectContent>\n    </Select>\n  }\n>\n  <ChartAreaInteractive />\n</SectionWithHeader>`,
      },
    ],
    tags: ["section", "layout", "header", "title", "container", "wrapper"],
    relatedComponents: ["card", "primary-page-template"],
  },

  {
    id: "ask-leo-button",
    name: "AskLeoButton",
    category: "composite",
    subcategory: "layout",
    description: "Button that opens the Leo AI panel with a pre-filled context query. Use at the end of data sections to let users ask questions about the visible data.",
    filePath: "src/components/shared/ask-leo-button.tsx",
    importPath: "@/components/shared/ask-leo-button",
    props: [
      { name: "query", type: "string", required: false, description: "Pre-filled query string for Leo. If omitted, opens the panel without a query." },
      { name: "label", type: "string", required: false, default: '"Ask Leo"', description: "Button label" },
    ],
    examples: [
      { title: "Ask Leo about chart data", code: `import { AskLeoButton } from "@/components/shared/ask-leo-button"\n\n<AskLeoButton query="Analyze the placement trends shown in this chart and identify anomalies" />` },
    ],
    tags: ["leo", "ai", "assistant", "button", "chat", "ask"],
  },

  // ════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ════════════════════════════════════════════════════════════════

  {
    id: "primary-page-template",
    name: "PrimaryPageTemplate",
    category: "template",
    description: "Standard layout for list/table pages. Includes: collapsible metrics row, search bar, filter chips, tab navigation with counts, table properties manager, floating bulk actions bar. Use this for pages with a DataTable as the primary content.",
    filePath: "src/components/shared/primary-page-template.tsx",
    importPath: "@/components/shared/primary-page-template",
    props: [
      { name: "title", type: "string", required: true, description: "Page title" },
      { name: "description", type: "string", required: true, description: "Page description" },
      { name: "metrics", type: "PrimaryPageMetricsConfig", required: false, description: "Key metrics section config" },
      { name: "views", type: "ViewConfig[]", required: true, description: "Tab definitions with id, label, count" },
      { name: "activeTab", type: "string", required: true, description: "Currently active tab id" },
      { name: "onTabChange", type: "(tab: string) => void", required: true, description: "Tab change handler" },
      { name: "searchPlaceholder", type: "string", required: false, description: "Search input placeholder" },
      { name: "searchQuery", type: "string", required: true, description: "Controlled search value" },
      { name: "onSearchChange", type: "(q: string) => void", required: true, description: "Search change handler" },
      { name: "filters", type: "PrimaryPageFilterConfig", required: true, description: "Filter configuration" },
      { name: "renderTabContent", type: "(tabId: string) => React.ReactNode", required: true, description: "Render function for tab content" },
      { name: "selectedItems", type: "string[]", required: false, description: "Selected row IDs for bulk actions" },
      { name: "bulkActions", type: "PrimaryPageBulkAction[]", required: false, description: "Bulk action buttons shown when rows selected" },
      { name: "fullPageScroll", type: "boolean", required: false, default: "false", description: "Use full-page scroll (content pages) vs sticky header (list pages)" },
    ],
    examples: [
      {
        title: "Student list page",
        code: `import { PrimaryPageTemplate } from "@/components/shared/primary-page-template"\n\n<PrimaryPageTemplate\n  title="Student Schedules"\n  description="Manage and track all student placement schedules"\n  metrics={{\n    items: [\n      { title: "Total", value: "247", trend: "up", change: "+8%" },\n      { title: "This Week", value: "12", trend: "neutral" },\n      { title: "Compliance Alerts", value: "3", trend: "down", change: "-2" },\n    ]\n  }}\n  views={[\n    { id: "upcoming", label: "Upcoming", count: 45 },\n    { id: "ongoing", label: "Ongoing", count: 89 },\n    { id: "completed", label: "Completed", count: 113 },\n  ]}\n  activeTab={activeTab}\n  onTabChange={setActiveTab}\n  searchQuery={searchQuery}\n  onSearchChange={setSearchQuery}\n  searchPlaceholder="Search by student, site, or preceptor..."\n  filters={{ configs: filterConfigs, active: activeFilters, onChange: setActiveFilters }}\n  renderTabContent={(tab) => <DataTable columns={columns} data={filteredData[tab]} />}\n  selectedItems={selectedIds}\n  bulkActions={[\n    { label: "Send Reminder", icon: "bell", onClick: handleReminder },\n    { label: "Export", icon: "download", onClick: handleExport },\n  ]}\n/>`,
      },
    ],
    tags: ["page", "template", "list", "table", "metrics", "tabs", "search", "filter", "layout"],
    relatedComponents: ["data-table", "filter-bar", "key-metrics-showcase"],
  },

  {
    id: "report-page-template",
    name: "ReportPageTemplate",
    category: "template",
    description: "Standard layout for content/analytics pages. Full-page scroll with tabs, no top metrics row. Use for reports, dashboards with charts, and detail pages.",
    filePath: "src/components/shared/report-page-template.tsx",
    importPath: "@/components/shared/report-page-template",
    props: [
      { name: "title", type: "string", required: true, description: "Page title" },
      { name: "description", type: "string", required: false, description: "Page description" },
      { name: "tabs", type: "ReportTab[]", required: true, description: "Tab definitions" },
      { name: "activeTab", type: "string", required: true, description: "Active tab id" },
      { name: "onTabChange", type: "(tab: string) => void", required: true, description: "Tab change handler" },
      { name: "headerActions", type: "React.ReactNode", required: false, description: "Actions in the header (e.g. date range picker, export button)" },
      { name: "renderTabContent", type: "(tabId: string) => React.ReactNode", required: true, description: "Tab content renderer" },
    ],
    examples: [
      {
        title: "Analytics report page",
        code: `import { ReportPageTemplate } from "@/components/shared/report-page-template"\n\n<ReportPageTemplate\n  title="Placement Analytics"\n  description="Detailed analysis of placement performance"\n  tabs={[\n    { id: "overview", label: "Overview" },\n    { id: "trends", label: "Trends" },\n    { id: "compliance", label: "Compliance" },\n  ]}\n  activeTab={activeTab}\n  onTabChange={setActiveTab}\n  headerActions={\n    <Button variant="outline" size="sm">\n      <Download className="h-4 w-4" />\n      Export PDF\n    </Button>\n  }\n  renderTabContent={(tab) => {\n    if (tab === "overview") return <OverviewSection />\n    if (tab === "trends") return <TrendsSection />\n    return <ComplianceSection />\n  }}\n/>`,
      },
    ],
    tags: ["page", "template", "report", "analytics", "dashboard", "charts", "content"],
    relatedComponents: ["section-with-header", "chart-area-interactive"],
  },

  {
    id: "welcome-page-template",
    name: "WelcomePageTemplate",
    category: "template",
    description: "Reusable layout for welcome/landing-style pages. Configurable header (title, description, typography variant), background (sidebar, background, muted), and two-column layout with optional illustration.",
    filePath: "src/components/shared/welcome-page-template.tsx",
    importPath: "@/components/shared/welcome-page-template",
    props: [
      { name: "title", type: "string", required: true, description: "Main heading text" },
      { name: "description", type: "string", required: true, description: "Subtitle or description below the heading" },
      { name: "background", type: '"sidebar" | "background" | "muted"', required: false, default: '"sidebar"', description: "Background variant — sidebar (brand), background (neutral), or muted" },
      { name: "headerVariant", type: '"hero" | "page-title" | "page-title-sm"', required: false, default: '"hero"', description: "Header typography — hero (40px), page-title (32px), or page-title-sm (24px)" },
      { name: "children", type: "React.ReactNode", required: true, description: "Primary and secondary actions (e.g. buttons)" },
      { name: "illustration", type: "React.ReactNode", required: false, description: "Optional illustration or image for the right column" },
    ],
    examples: [
      {
        title: "Welcome / onboarding page",
        code: `import { WelcomePageTemplate } from "@/components/shared/welcome-page-template"\nimport { Button } from "@/components/ui/button"\n\n<WelcomePageTemplate\n  title="Welcome to Exxat One"\n  description="Let's set up your profile so we can help you discover the perfect clinical opportunities."\n  background="sidebar"\n  headerVariant="hero"\n  illustration={<img src="/welcome.png" alt="" className="max-w-full max-h-[320px] object-contain" />}\n>\n  <Button>Build my Profile</Button>\n  <Button variant="ghost">I'll do later</Button>\n</WelcomePageTemplate>`,
      },
    ],
    tags: ["page", "template", "welcome", "landing", "onboarding", "hero", "layout"],
    relatedComponents: ["primary-page-template", "report-page-template"],
  },
];

// ─── Helper utilities ─────────────────────────────────────────────────────

/** Find components matching a query across name, tags, description, and subcategory. */
export function findComponents(query: {
  tags?: string[];
  category?: ComponentEntry["category"];
  subcategory?: string;
  search?: string;
}): ComponentEntry[] {
  return registry.filter((entry) => {
    if (query.category && entry.category !== query.category) return false;
    if (query.subcategory && entry.subcategory !== query.subcategory) return false;
    if (query.tags?.length) {
      const hasTag = query.tags.some((t) => entry.tags.includes(t));
      if (!hasTag) return false;
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      return (
        entry.name.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.tags.some((t) => t.includes(term))
      );
    }
    return true;
  });
}

/** Get a component by ID. */
export function getComponent(id: string): ComponentEntry | undefined {
  return registry.find((c) => c.id === id);
}

/** List all unique categories. */
export const categories = [...new Set(registry.map((c) => c.category))];

/** List all unique subcategories. */
export const subcategories = [...new Set(registry.map((c) => c.subcategory).filter(Boolean))];

export default registry;
