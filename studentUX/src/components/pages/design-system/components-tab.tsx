import * as React from "react";
import { Button } from "../../ui/button";
import { Badge, CountBadge, NewBadge, BetaBadge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Skeleton } from "../../ui/skeleton";
import { Separator } from "../../ui/separator";
import { Progress } from "../../ui/progress";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { AlertTriangle, Download, MoreHorizontal } from "lucide-react";
import { FontAwesomeIcon } from "../../brand/font-awesome-icon";
import { registry } from "../../../design-system/registry";

// ─── Helpers ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="px-2 py-1 text-xs rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ComponentSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const entry = registry.find((c) => c.id === id);

  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {entry && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono flex-shrink-0">
            {entry.importPath}
          </span>
        )}
      </div>

      {/* Live preview */}
      <div className="rounded-xl border bg-card p-6">
        {children}
      </div>

      {/* First example code */}
      {entry?.examples[0] && (
        <div className="rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-xs text-muted-foreground">{entry.examples[0].title}</span>
            <CopyButton text={entry.examples[0].code} />
          </div>
          <pre className="text-xs p-4 overflow-x-auto text-muted-foreground leading-5">
            <code>{entry.examples[0].code}</code>
          </pre>
        </div>
      )}
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function ComponentsTab() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const [switchOn, setSwitchOn] = React.useState(true);
  const [radioValue, setRadioValue] = React.useState("option-b");

  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-8 max-w-7xl mx-auto w-full">

      {/* ── Actions ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Actions</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Interactive elements that trigger operations.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection
            id="button"
            title="Button"
            description="6 variants × 4 sizes. Default for primary CTAs, outline for secondary, destructive for delete."
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Variants</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Sizes</p>
                <div className="flex items-center flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Download">
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">With icon</p>
                <div className="flex flex-wrap gap-2">
                  <Button>
                    <FontAwesomeIcon name="plus" className="h-4 w-4" aria-hidden="true" />
                    Add Student
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Export
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">States</p>
                <div className="flex flex-wrap gap-2">
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection
            id="badge"
            title="Badge"
            description="Status indicators and count labels. 4 standard variants plus NewBadge, BetaBadge, CountBadge."
          >
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Standard variants</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>Active</Badge>
                  <Badge variant="secondary">Pending</Badge>
                  <Badge variant="destructive">Overdue</Badge>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Special badges</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <NewBadge />
                  <BetaBadge />
                  <CountBadge>24</CountBadge>
                  <CountBadge>9+</CountBadge>
                </div>
              </div>
            </div>
          </ComponentSection>

        </div>
      </section>

      <Separator />

      {/* ── Forms ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Forms & Inputs</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Form controls. Always pair inputs with visible labels. Use Switch for settings, Checkbox for multi-select.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection id="input" title="Input" description="Text input. Always use with a Label.">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-demo">Email address</Label>
                <Input id="email-demo" type="email" placeholder="you@example.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name-demo">Full name</Label>
                <Input id="name-demo" placeholder="Alex Morgan" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="disabled-demo">Disabled state</Label>
                <Input id="disabled-demo" placeholder="Not editable" disabled />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="checkbox" title="Checkbox" description="Multi-select scenarios. Supports indeterminate state for partial table selection.">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="cb1" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
                <Label htmlFor="cb1">Receive email notifications</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cb2" defaultChecked />
                <Label htmlFor="cb2">Auto-confirm approved slots</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cb3" disabled />
                <Label htmlFor="cb3" className="text-muted-foreground">Disabled option</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="cb4" checked="indeterminate" />
                <Label htmlFor="cb4">Partial selection (indeterminate)</Label>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="switch" title="Switch" description="Boolean toggle. Prefer over checkbox for live-update settings.">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch id="sw1" checked={switchOn} onCheckedChange={setSwitchOn} />
                <Label htmlFor="sw1">Email notifications {switchOn ? "(On)" : "(Off)"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="sw2" defaultChecked />
                <Label htmlFor="sw2">Slack integration</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="sw3" disabled />
                <Label htmlFor="sw3" className="text-muted-foreground">Disabled setting</Label>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="select" title="Select" description="Single-value dropdown. Use for status pickers, filter fields, and form selects with predefined options.">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="select-status">Status</Label>
                <Select>
                  <SelectTrigger id="select-status">
                    <SelectValue placeholder="Select a status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="select-period">Time period</Label>
                <Select defaultValue="90d">
                  <SelectTrigger id="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Disabled</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Not selectable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="x">Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="textarea" title="Textarea" description="Multi-line text input. Use for notes, descriptions, and longer-form fields. Always pair with a Label.">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes-demo">Notes</Label>
                <Textarea id="notes-demo" placeholder="Add notes about this record..." className="resize-none" rows={3} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desc-demo">Description</Label>
                <Textarea id="desc-demo" defaultValue="This rotation covers advanced clinical procedures and requires full compliance documentation before start date." className="resize-none" rows={3} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ta-disabled">Disabled</Label>
                <Textarea id="ta-disabled" placeholder="Not editable" disabled className="resize-none" rows={2} />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="radio-group" title="RadioGroup" description="Single-select from a visible list. Use when options are ≤5 and should all be visible without a dropdown.">
            <RadioGroup value={radioValue} onValueChange={setRadioValue} className="flex flex-col gap-2 max-w-xs">
              {[
                { value: "option-a", label: "Pending review" },
                { value: "option-b", label: "Active" },
                { value: "option-c", label: "Completed" },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value}>{label}</Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <RadioGroupItem value="option-d" id="option-d" disabled />
                <Label htmlFor="option-d" className="text-muted-foreground">Archived (disabled)</Label>
              </div>
            </RadioGroup>
          </ComponentSection>

        </div>
      </section>

      <Separator />

      {/* ── Display ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Display</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Content containers and visual indicators.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection id="card" title="Card" description="Container for grouped content. Use rounded-xl border for standard cards.">
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-xl border">
                <CardHeader>
                  <CardTitle>Student Overview</CardTitle>
                  <CardDescription>Current placement status</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">247 active placements this semester.</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border bg-muted/30">
                <CardHeader>
                  <CardTitle>Compliance Rate</CardTitle>
                  <CardDescription>Document completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl font-bold">94%</span>
                    <Progress value={94} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ComponentSection>

          <ComponentSection id="avatar" title="Avatar" description="User profile image with auto-fallback to initials.">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face" alt="Dr. Sarah Johnson" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">EW</AvatarFallback>
              </Avatar>
            </div>
          </ComponentSection>

          <ComponentSection id="skeleton" title="Skeleton" description="Loading placeholder. Use in Suspense fallbacks and data-loading states.">
            <div className="flex flex-col gap-3 max-w-sm">
              <Skeleton className="h-8 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="progress" title="Progress" description="Linear progress bar for completion percentages.">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Compliance</span><span>94%</span>
                </div>
                <Progress value={94} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Documents uploaded</span><span>67%</span>
                </div>
                <Progress value={67} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Orientation complete</span><span>32%</span>
                </div>
                <Progress value={32} />
              </div>
            </div>
          </ComponentSection>

        </div>
      </section>

      <Separator />

      {/* ── Feedback ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Feedback</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Messages and notifications that communicate state to users.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection id="alert" title="Alert" description="Inline contextual messages. Use for important non-dismissible information. For toasts, use Sonner.">
            <div className="flex flex-col gap-3">
              <Alert>
                <FontAwesomeIcon name="circleInfo" className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>23 slot requests are awaiting review before Friday's deadline.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>15 student schedules have missing compliance documents.</AlertDescription>
              </Alert>
            </div>
          </ComponentSection>

        </div>
      </section>

      <Separator />

      {/* ── Navigation ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Navigation</h2>
        <p className="text-sm text-muted-foreground mb-6">
          In-page navigation and structure components.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection id="tabs" title="Tabs" description="Switch between views or filter by status. Always use flex-nowrap for horizontal scroll when there are many tabs.">
            <Tabs defaultValue="upcoming">
              <TabsList className="flex-nowrap">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                <p className="text-sm text-muted-foreground p-4">45 upcoming placements</p>
              </TabsContent>
              <TabsContent value="ongoing">
                <p className="text-sm text-muted-foreground p-4">89 ongoing placements</p>
              </TabsContent>
              <TabsContent value="completed">
                <p className="text-sm text-muted-foreground p-4">113 completed placements</p>
              </TabsContent>
              <TabsContent value="compliance">
                <p className="text-sm text-muted-foreground p-4">Compliance tracking matrix</p>
              </TabsContent>
            </Tabs>
          </ComponentSection>

        </div>
      </section>

      <Separator />

      {/* ── Overlays ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Overlays</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Contextual and focused UI layers.
        </p>
        <div className="flex flex-col gap-12">

          <ComponentSection id="dialog" title="Dialog" description="Modal for forms and confirmations. Blocks background interaction.">
            <div>
              <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Approval</DialogTitle>
                    <DialogDescription>
                      This will approve all 12 selected slot requests and notify the site coordinators.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => setDialogOpen(false)}>Approve All</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </ComponentSection>

          <ComponentSection id="tooltip" title="Tooltip" description="Brief hint on hover. Essential for icon-only buttons.">
            <TooltipProvider>
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Download data">
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download data</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More actions">
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More actions</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </ComponentSection>

          <ComponentSection id="dropdown-menu" title="DropdownMenu" description="Contextual action menu. Use for row actions and overflow menus.">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions
                  <FontAwesomeIcon name="chevronDown" className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit record</DropdownMenuItem>
                <DropdownMenuItem>Send reminder</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ComponentSection>

        </div>
      </section>

    </div>
  );
}
