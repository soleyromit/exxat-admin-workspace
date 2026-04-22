"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import FilterBar, {
  type ActiveFilter,
  type FilterConfig,
} from "@/components/shared/filter-bar";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import { ProfileSectionCard } from "@/components/features/profile-settings-modal";
import { MapSection, type MapLocation } from "@/components/shared/map-section";
import { InternshipCard } from "@/components/shared/internship-card";
import { ScheduleListViewRow } from "@/components/shared/schedule-list-view-row";
import { WishlistCard } from "@/components/shared/wishlist-card";
import { logoUrl } from "@/data/jobs-data";
import { formatDateRange } from "@/utils/date-utils";
import { useIsMobile } from "@/components/ui/use-mobile";
import { cn, touchTargetMobileClasses } from "@/components/ui/utils";
import type { WishlistItem } from "@/data/wishlist-data";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SubmitPreferencesFlowProps {
  item: WishlistItem;
  onBack: () => void;
  onComplete?: () => void;
  onViewInstructions?: () => void;
}

export interface SubmitPreferencesInstructionsModalProps {
  item: WishlistItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

interface InstructionStep {
  id: string;
  section?: string;
  title: string;
  content: React.ReactNode;
}

interface PreferenceOption {
  id: string;
  organizationName: string;
  /** Site name (e.g. "West Campus", "East Pavilion") — specific site, not hospital location */
  siteName: string;
  /** Hospital location name (e.g. "Mayo Clinic West Campus") — facility name for location display */
  hospitalLocationName: string;
  internshipName: string;
  logoSrc: string;
  location: string;
  setting: string;
  specialization: string;
  state: string;
  program: string;
  internshipAtLabel: string;
  locationsLabel: string;
  dateLabel: string;
  startDate: Date;
  internshipType: "Group" | "Individual";
  paymentRequired: boolean;
  isPartner: boolean;
  lat: number;
  lng: number;
}

const MIN_PREFERENCES_REQUIRED = 3;
const MAX_PREFERENCES_ALLOWED = 5;
const RANK_CIRCLE_CLASS =
  "border-transparent bg-chip-filled-1 text-chip-1";
const CARD_WIDTH_DESKTOP = 400;

type PreferenceGroupId = "ranked" | "saved" | "others";
const GROUP_META: Record<
  PreferenceGroupId,
  { label: string; icon: "listOl" | "heart" | "inbox"; headerBg: string; borderClass: string; iconClass: string }
> = {
  ranked: { label: "Ranked", icon: "listOl", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-chip-1" },
  saved: { label: "Saved", icon: "heart", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-chip-2" },
  others: { label: "Others", icon: "inbox", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-muted-foreground" },
};
const GROUP_ORDER: PreferenceGroupId[] = ["ranked", "saved", "others"];
const CARD_WIDTH_MOBILE = 340;
const SHEET_CONTENT_STYLE = {
  top: "4rem",
  bottom: "0",
  left: "0.5rem",
  right: "0.5rem",
  maxHeight: "calc(100vh - 4rem)",
  borderRadius: "var(--radius-2xl)",
  overflow: "hidden",
  boxShadow: "var(--shadow-modal-deep)",
};
const MODAL_GRADIENT_BG =
  "linear-gradient(0deg, transparent 0%, var(--background) 60%), linear-gradient(315deg, color-mix(in oklab, var(--chart-4) 8%, transparent) 0%, color-mix(in oklab, var(--chart-3) 10%, transparent) 30%, color-mix(in oklab, var(--chart-2) 12%, transparent) 60%, color-mix(in oklab, var(--chart-1) 15%, transparent) 100%)";

const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    id: "intro",
    title: "About the Exxat Wishlist",
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Communicate your professional preferences. Rankings reflect your goals and placement availability.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs font-normal bg-chart-1/10 text-chip-1 border-chip-1/40">
            Goals
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal bg-chart-2/10 text-chip-2 border-chip-2/40">
            Preparation
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal bg-chart-3/10 text-chip-3 border-chip-3/40">
            Availability
          </Badge>
        </div>
      </div>
    ),
  },
  {
    id: "know-goal",
    section: "I. Before You Begin",
    title: "Know Your Goal",
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Define your Top 3 Learning Objectives:</p>
        <div className="grid gap-2">
          {["Niche skills", "Population experience", "Setting type"].map((label, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium">{i + 1}. {label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "research-locations",
    section: "I. Before You Begin",
    title: "Research Locations",
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            Site descriptions
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            Rotations
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            Setting types
          </Badge>
        </div>
        <p className="text-sm text-foreground rounded-lg border border-chart-4/40 bg-chart-4/5 p-3">
          Check commute time. Don&apos;t rank sites that create undue burden.
        </p>
      </div>
    ),
  },
  {
    id: "rank-genuine",
    section: "II. Strategic Ranking",
    title: "Rank by Genuine Preference",
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">1 = Your true top priority</p>
        <p className="text-xs text-muted-foreground">Do not rank by ease, assumptions, or convenience alone.</p>
      </div>
    ),
  },
  {
    id: "variety",
    section: "II. Strategic Ranking",
    title: "Prioritize Variety",
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Select a diverse range for better match odds:</p>
        <div className="grid grid-cols-2 gap-2">
          {["Settings", "Populations", "Areas", "Backups"].map((label) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "fill-slots",
    section: "III. Before Submit",
    title: "Fill All Slots",
    content: (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-chart-2/40 bg-chart-2/5 p-4">
          <p className="text-sm font-semibold">Minimum required = Mandatory</p>
          <p className="text-xs text-muted-foreground">Incomplete = Wishlist marked incomplete</p>
        </div>
      </div>
    ),
  },
  {
    id: "comments",
    section: "II. Strategic Ranking",
    title: "Comments & Rationale",
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Make a professional case. Focus on learning goals.</p>
        <div className="grid gap-2">
          <div className="flex items-start gap-2 rounded-lg border border-chip-2/40 bg-chart-2/5 p-3">
            <Badge variant="secondary" className="shrink-0 text-xs font-normal bg-chart-2/10 text-chip-2 border-chip-2/40">
              Good
            </Badge>
            <p className="text-xs text-foreground">&quot;Neurological population exposure aligns with capstone focus.&quot;</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <Badge variant="secondary" className="shrink-0 text-xs font-normal bg-destructive/10 text-destructive border-destructive/40">
              Poor
            </Badge>
            <p className="text-xs text-foreground">&quot;Close to home.&quot;</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "checklist",
    section: "III. Before Submit",
    title: "Review Checklist",
    content: (
      <div className="grid gap-2">
        {["Quantity", "Ranking", "Completeness", "Accuracy", "Professionalism"].map((label) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
];

function getInitials(label: string) {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDateRangeBucket(startDate: Date) {
  const month = startDate.getMonth();
  if (month <= 2) return "Jan - Mar 2026";
  if (month <= 5) return "Apr - Jun 2026";
  if (month <= 8) return "Jul - Sep 2026";
  return "Oct - Dec 2026";
}

function buildPreferenceOptions(item: WishlistItem): PreferenceOption[] {
  const specialtyLabel = item.specialty ?? "Clinical Practice";
  const programLabel = item.programLabel ?? "PTP3 • PT Practice III (DPT 0763)";
  const programOptions = [
    programLabel,
    "PTP2 • PT Practice II (DPT 0662)",
    "PTP4 • PT Practice IV (DPT 0864)",
  ] as const;
  const settingOptions = [
    "IP-Acute Care",
    "Outpatient Rehab",
    "Pediatric Care",
    "Neuro Rehab",
    "Orthopedic Care",
    "Skilled Nursing",
  ] as const;
  const siteTemplates = [
    {
      organizationName: "ATI",
      titlePrefix: "Emergency Medicine Clinical Rotation",
      domain: "atipt.com",
      baseLocation: "Bloomfield, NJ",
      lat: 40.8068,
      lng: -74.1854,
    },
    {
      organizationName: "Mayo Clinic",
      titlePrefix: "Advanced Clinical Experience",
      domain: "mayoclinic.org",
      baseLocation: "Rochester, MN",
      lat: 44.0216,
      lng: -92.4699,
    },
    {
      organizationName: "Johns Hopkins",
      titlePrefix: "Spring Acute Care Rotation",
      domain: "hopkinsmedicine.org",
      baseLocation: "Baltimore, MD",
      lat: 39.2975,
      lng: -76.5924,
    },
    {
      organizationName: "Kaiser Permanente",
      titlePrefix: "Family Medicine Rotation",
      domain: "kaiserpermanente.org",
      baseLocation: "Oakland, CA",
      lat: 37.8044,
      lng: -122.2712,
    },
    {
      organizationName: "Cleveland Clinic",
      titlePrefix: "Neurologic Rehab Internship",
      domain: "clevelandclinic.org",
      baseLocation: "Cleveland, OH",
      lat: 41.4993,
      lng: -81.6944,
    },
    {
      organizationName: "MedStar",
      titlePrefix: "Orthopedic Practice Rotation",
      domain: "medstarhealth.org",
      baseLocation: "Washington, DC",
      lat: 38.9072,
      lng: -77.0369,
    },
    {
      organizationName: "Children's National",
      titlePrefix: "Pediatric Specialty Rotation",
      domain: "childrensnational.org",
      baseLocation: "Washington, DC",
      lat: 38.9296,
      lng: -77.0146,
    },
    {
      organizationName: "Mass General",
      titlePrefix: "Hospital-Based Clinical Rotation",
      domain: "massgeneral.org",
      baseLocation: "Boston, MA",
      lat: 42.3626,
      lng: -71.0695,
    },
    {
      organizationName: "Stanford Medicine",
      titlePrefix: "Integrated Rehab Rotation",
      domain: "stanfordhealthcare.org",
      baseLocation: "Palo Alto, CA",
      lat: 37.4419,
      lng: -122.143,
    },
  ] as const;
  const neighborhoodSuffixes = [
    "Bloomfield",
    "West Campus",
    "East Pavilion",
    "Downtown",
    "North Campus",
  ] as const;

  return Array.from({ length: 45 }, (_, index) => {
    const template = siteTemplates[index % siteTemplates.length];
    const suffix = neighborhoodSuffixes[index % neighborhoodSuffixes.length];
    const cohortYear = 2026 + Math.floor(index / 18);
    const startDate = new Date(2026, index % 10, 2 + (index % 6));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 32);

    const hospitalLocationName = `${template.organizationName} ${suffix}`;
    return {
      id: `${item.id}-${index + 1}`,
      organizationName: template.organizationName,
      siteName: suffix,
      hospitalLocationName,
      internshipName: `${template.titlePrefix} ${cohortYear}`,
      logoSrc: logoUrl(template.domain),
      location: template.baseLocation,
      setting: settingOptions[index % settingOptions.length],
      specialization: specialtyLabel,
      state: template.baseLocation.split(", ").at(-1) ?? "",
      program: programOptions[index % programOptions.length],
      internshipAtLabel: index % 3 === 0 ? template.baseLocation : `${2 + (index % 5)} locations`,
      locationsLabel: `${2 + (index % 5)} locations`,
      dateLabel: formatDateRange(startDate, endDate),
      startDate,
      internshipType: index % 2 === 0 ? "Group" : "Individual",
      paymentRequired: index % 4 === 0,
      isPartner: index % 3 !== 1,
      lat: template.lat + (index % 3) * 0.08,
      lng: template.lng - (index % 4) * 0.08,
    };
  });
}

export function SubmitPreferencesInstructionsModal({
  item,
  open,
  onOpenChange,
  onContinue,
}: SubmitPreferencesInstructionsModalProps) {
  const isMobile = useIsMobile();
  const preferenceOptions = React.useMemo(() => buildPreferenceOptions(item), [item]);
  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [hasContentBelow, setHasContentBelow] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrolled(el.scrollTop > 16);
    setHasContentBelow(el.scrollTop > 0);
  }, []);

  React.useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
      setIsScrolled(false);
      setHasContentBelow(false);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-transparent"
        style={SHEET_CONTENT_STYLE}
        className="flex flex-col gap-0 border p-0 w-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Instructions — {item.rotationTitle ?? item.facilityName}</SheetTitle>
        </SheetHeader>
        <div className="relative z-20 flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-3 h-10 w-10 shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close instructions"
          >
            <FontAwesomeIcon name="circleXmark" className="text-2xl" weight="solid" aria-hidden />
          </Button>
        </div>
        <div
          className="flex min-h-0 flex-1 flex-col gap-0 px-4 pt-2 lg:px-6 lg:pt-4"
          style={{ background: MODAL_GRADIENT_BG }}
        >
          <div className="relative z-10 flex w-full shrink-0 items-center justify-center">
            <div className="mx-auto w-full" style={{ maxWidth: cardWidth }}>
              <div
                className={cn(
                  "relative z-10 flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200",
                  isScrolled ? "p-3 sm:p-4" : "p-4 sm:p-5 md:p-6",
                  hasContentBelow && "shadow-md"
                )}
              >
                <div className={cn("flex min-w-0 flex-col gap-2", isScrolled && "gap-0")}>
                  <h1 className="page-title-sm truncate">Instructions</h1>
                  <p className={cn("truncate text-sm text-muted-foreground", isScrolled && "text-xs")}>
                    {item.rotationTitle ?? item.facilityName}
                  </p>
                </div>
                {!isScrolled && (
                  <div className="mt-4 -mx-2">
                    <WishlistCard item={item} className="rounded-2xl border border-border" hideCta hideBadges hideIcons />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
            role="region"
            aria-live="polite"
          >
            <div
              className="mx-auto flex w-full shrink-0 flex-col gap-4 pb-24 pt-4"
              style={{ maxWidth: cardWidth }}
            >
              {INSTRUCTION_STEPS.map((step) => (
                <ProfileSectionCard
                  key={step.id}
                  title={step.title}
                  section={step.section}
                  cardClassName="rounded-2xl border border-border"
                >
                  {step.content}
                </ProfileSectionCard>
              ))}
            </div>

            <div className="sticky bottom-0 flex w-full justify-center border-t border-border/50 bg-background/40 py-4 pt-6 backdrop-blur-md">
              <div style={{ width: cardWidth }} className="mx-auto w-full max-w-full">
                <Button
                  onClick={onContinue}
                  className={cn("w-full", touchTargetMobileClasses, "md:h-10")}
                  aria-label="Continue to preferences page"
                >
                  Continue to Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Full-page submit-preferences flow for Wishlist. */
export function SubmitPreferencesFlow({ item, onBack, onComplete, onViewInstructions }: SubmitPreferencesFlowProps) {
  const isMobile = useIsMobile();
  const preferenceOptions = React.useMemo(() => buildPreferenceOptions(item), [item]);
  const [activeTab, setActiveTab] = React.useState<"all" | "ranked" | "saved">("all");
  const [viewMode, setViewMode] = React.useState<"rows" | "map">("rows");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
  const [selectedPreferenceIds, setSelectedPreferenceIds] = React.useState<string[]>([]);
  const [savedPreferenceIds, setSavedPreferenceIds] = React.useState<string[]>([]);
  const [confirmedInstructions, setConfirmedInstructions] = React.useState(false);
  const [preferenceReasons, setPreferenceReasons] = React.useState<Record<string, string>>({});
  const [submittedAt, setSubmittedAt] = React.useState<Date | null>(null);
  const [phase, setPhase] = React.useState<"preferences" | "review" | "submitted">("preferences");
  const [showNoPreferencesDialog, setShowNoPreferencesDialog] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [selectedOptionIdForMap, setSelectedOptionIdForMap] = React.useState<string | null>(null);
  const [hoveredOptionIdForMap, setHoveredOptionIdForMap] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const cardsScrollRef = React.useRef<HTMLDivElement>(null);
  const cardRefsMapRef = React.useRef<Record<string, HTMLDivElement | null>>({});

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrolled(el.scrollTop > 80);
  }, []);

  const scrollToCard = React.useCallback((optionId: string) => {
    const el = cardRefsMapRef.current[optionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const selectedPreferences = React.useMemo(
    () =>
      selectedPreferenceIds
        .map((id) => preferenceOptions.find((option) => option.id === id))
        .filter((option): option is PreferenceOption => Boolean(option)),
    [preferenceOptions, selectedPreferenceIds]
  );
  const wishlistName = item.rotationTitle ?? item.facilityName;
  const submittedWishlistItem = React.useMemo(
    () => ({
      ...item,
      status: "preferences-submitted" as const,
      preferencesSubmitted: selectedPreferences.length,
      preferencesSubmittedDate: submittedAt ?? new Date(),
    }),
    [item, selectedPreferences.length, submittedAt]
  );

  const filterConfigs = React.useMemo<FilterConfig[]>(
    () => [
      {
        key: "specialization",
        label: "Specialization",
        icon: "bookOpen",
        options: Array.from(new Set(preferenceOptions.map((option) => option.specialization))).sort(),
      },
      {
        key: "state",
        label: "State",
        icon: "mapPin",
        options: Array.from(new Set(preferenceOptions.map((option) => option.state))).sort(),
      },
      {
        key: "dateRange",
        label: "Date Range",
        icon: "calendarDays",
        options: ["Jan - Mar 2026", "Apr - Jun 2026", "Jul - Sep 2026", "Oct - Dec 2026"],
      },
      {
        key: "experienceType",
        label: "Experience Type",
        icon: "users",
        options: ["Group", "Individual"],
      },
      {
        key: "program",
        label: "Program",
        icon: "graduationCap",
        options: Array.from(new Set(preferenceOptions.map((option) => option.program))).sort(),
      },
    ],
    [preferenceOptions]
  );

  const filteredOptions = React.useMemo(() => {
    let options =
      activeTab === "ranked"
        ? selectedPreferences
        : activeTab === "saved"
          ? preferenceOptions.filter((option) => savedPreferenceIds.includes(option.id))
          : preferenceOptions;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      options = options.filter((option) =>
        [
          option.siteName,
          option.hospitalLocationName,
          option.internshipName,
          option.specialization,
          option.location,
          option.state,
          option.program,
          option.organizationName,
        ].some((value) => value.toLowerCase().includes(query))
      );
    }

    activeFilters.forEach((filter) => {
      if (filter.values.length === 0) return;
      options = options.filter((option) => {
        switch (filter.key) {
          case "specialization":
            return filter.values.includes(option.specialization);
          case "state":
            return filter.values.includes(option.state);
          case "dateRange":
            return filter.values.includes(getDateRangeBucket(option.startDate));
          case "experienceType":
            return filter.values.includes(option.internshipType);
          case "program":
            return filter.values.includes(option.program);
          default:
            return true;
        }
      });
    });

    return [...options].sort((a, b) => {
      const aRank = selectedPreferenceIds.indexOf(a.id);
      const bRank = selectedPreferenceIds.indexOf(b.id);
      const aIsRanked = aRank >= 0;
      const bIsRanked = bRank >= 0;
      if (aIsRanked && bIsRanked) return aRank - bRank;
      if (aIsRanked && !bIsRanked) return -1;
      if (!aIsRanked && bIsRanked) return 1;
      return 0;
    });
  }, [activeFilters, activeTab, preferenceOptions, savedPreferenceIds, searchQuery, selectedPreferences, selectedPreferenceIds]);

  const groupedOptions = React.useMemo((): Record<PreferenceGroupId, PreferenceOption[]> => {
    const map: Record<PreferenceGroupId, PreferenceOption[]> = {
      ranked: [],
      saved: [],
      others: [],
    };
    filteredOptions.forEach((option) => {
      if (selectedPreferenceIds.includes(option.id)) {
        map.ranked.push(option);
      } else if (savedPreferenceIds.includes(option.id)) {
        map.saved.push(option);
      } else {
        map.others.push(option);
      }
    });
    return map;
  }, [filteredOptions, selectedPreferenceIds, savedPreferenceIds]);

  const mapLocations = React.useMemo<MapLocation[]>(
    () =>
      filteredOptions.map((option, index) => ({
        id: index + 1,
        name: option.hospitalLocationName,
        city: option.location,
        lat: option.lat,
        lng: option.lng,
        count: selectedPreferenceIds.includes(option.id)
          ? selectedPreferenceIds.indexOf(option.id) + 1
          : 1,
        type: option.setting,
        isNew: savedPreferenceIds.includes(option.id),
      })),
    [filteredOptions, savedPreferenceIds, selectedPreferenceIds]
  );

  const rankedProgressValue = (selectedPreferenceIds.length / MAX_PREFERENCES_ALLOWED) * 100;

  const resetAndBack = React.useCallback(() => {
    setPhase("preferences");
    setActiveTab("all");
    setViewMode("rows");
    setSearchQuery("");
    setActiveFilters([]);
    setSelectedPreferenceIds([]);
    setSavedPreferenceIds([]);
    setConfirmedInstructions(false);
    setPreferenceReasons({});
    setSubmittedAt(null);
    onBack();
  }, [onBack]);

  const togglePreference = React.useCallback((optionId: string) => {
    setSelectedPreferenceIds((current) => {
      if (current.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }
      if (current.length >= MAX_PREFERENCES_ALLOWED) {
        return current;
      }
      return [...current, optionId];
    });
  }, []);

  const toggleSaved = React.useCallback((optionId: string) => {
    setSavedPreferenceIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    );
  }, []);

  const movePreference = React.useCallback((optionId: string, direction: "up" | "down") => {
    setSelectedPreferenceIds((current) => {
      const index = current.indexOf(optionId);
      if (index === -1) return current;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  }, []);

  const canReview = selectedPreferenceIds.length >= MIN_PREFERENCES_REQUIRED;
  const canSubmit =
    selectedPreferenceIds.length >= MIN_PREFERENCES_REQUIRED && confirmedInstructions;

  React.useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  React.useEffect(() => {
    if (viewMode === "map") {
      setIsScrolled(false);
    }
  }, [viewMode]);

  const goToReview = React.useCallback(() => {
    if (!canReview) {
      setShowNoPreferencesDialog(true);
      return;
    }
    setPhase("review");
  }, [canReview]);

  const handleAddFilter = React.useCallback(
    (filterKey: string) => {
      const config = filterConfigs.find((filter) => filter.key === filterKey);
      setActiveFilters((current) => {
        const existing = current.find((filter) => filter.key === filterKey);
        if (existing) return current;
        return [
          ...current,
          {
            id: `${filterKey}_${Date.now()}`,
            key: filterKey,
            label: config?.label ?? filterKey,
            values: [],
            removable: true,
          },
        ];
      });
    },
    [filterConfigs]
  );

  const handleToggleFilterValue = React.useCallback((filterId: string, value: string) => {
    setActiveFilters((current) =>
      current.map((filter) =>
        filter.id === filterId
          ? {
              ...filter,
              values: filter.values.includes(value)
                ? filter.values.filter((existingValue) => existingValue !== value)
                : [...filter.values, value],
            }
          : filter
      )
    );
  }, []);

  const handleRemoveFilter = React.useCallback((filterId: string) => {
    setActiveFilters((current) => current.filter((filter) => filter.id !== filterId));
  }, []);

  const handleClearAllFilters = React.useCallback(() => {
    setActiveFilters([]);
  }, []);

  const renderRowAction = (option: PreferenceOption) => {
    const isRanked = selectedPreferenceIds.includes(option.id);
    const isSaved = savedPreferenceIds.includes(option.id);
    const rankIndex = selectedPreferenceIds.indexOf(option.id);

    return (
      <div className="flex items-center gap-2">
        {isRanked ? (
          <>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-lg font-extrabold",
                RANK_CIRCLE_CLASS
              )}
            >
              {rankIndex + 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                movePreference(option.id, "up");
              }}
              disabled={rankIndex === 0}
              aria-label={`Move ${option.hospitalLocationName} up`}
            >
              <FontAwesomeIcon name="chevronUp" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                movePreference(option.id, "down");
              }}
              disabled={rankIndex === selectedPreferenceIds.length - 1}
              aria-label={`Move ${option.hospitalLocationName} down`}
            >
              <FontAwesomeIcon name="chevronDown" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                togglePreference(option.id);
              }}
              aria-label={`Remove ${option.hospitalLocationName} from ranked list`}
            >
              <FontAwesomeIcon name="x" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={(event) => {
              event.stopPropagation();
              togglePreference(option.id);
            }}
            disabled={selectedPreferenceIds.length >= MAX_PREFERENCES_ALLOWED}
          >
            <FontAwesomeIcon name="plus" className="h-3.5 w-3.5" weight="light" aria-hidden />
            Add
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            toggleSaved(option.id);
          }}
          aria-label={isSaved ? `Remove ${option.hospitalLocationName} from saved` : `Save ${option.hospitalLocationName}`}
        >
          <FontAwesomeIcon name="heart" className={cn("h-4 w-4", isSaved && "text-primary")} weight={isSaved ? "solid" : "regular"} aria-hidden />
        </Button>
      </div>
    );
  };

  const renderCardAction = (option: PreferenceOption) => {
    const isRanked = selectedPreferenceIds.includes(option.id);
    const rankIndex = selectedPreferenceIds.indexOf(option.id);

    return (
      <div className="flex w-full items-center gap-2">
        {isRanked ? (
          <>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-lg font-extrabold",
                RANK_CIRCLE_CLASS
              )}
            >
              {rankIndex + 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                movePreference(option.id, "up");
              }}
              disabled={rankIndex === 0}
              aria-label={`Move ${option.hospitalLocationName} up`}
            >
              <FontAwesomeIcon name="chevronUp" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                movePreference(option.id, "down");
              }}
              disabled={rankIndex === selectedPreferenceIds.length - 1}
              aria-label={`Move ${option.hospitalLocationName} down`}
            >
              <FontAwesomeIcon name="chevronDown" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                togglePreference(option.id);
              }}
              aria-label={`Remove ${option.hospitalLocationName} from ranked list`}
            >
              <FontAwesomeIcon name="x" className="h-4 w-4" weight="light" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="default"
            className="w-full justify-center gap-1.5"
            onClick={(event) => {
              event.stopPropagation();
              togglePreference(option.id);
            }}
            disabled={selectedPreferenceIds.length >= MAX_PREFERENCES_ALLOWED}
          >
            <FontAwesomeIcon name="plus" className="h-3.5 w-3.5" weight="light" aria-hidden />
            Add
          </Button>
        )}
      </div>
    );
  };

  const renderOptionsContent = (options: PreferenceOption[], emptyMessage: string) => {
    const optionMapLocations: MapLocation[] = options.map((option, index) => ({
      id: index + 1,
      name: option.hospitalLocationName,
      city: option.location,
      lat: option.lat,
      lng: option.lng,
      count: selectedPreferenceIds.includes(option.id)
        ? selectedPreferenceIds.indexOf(option.id) + 1
        : 1,
      type: option.setting,
      isNew: savedPreferenceIds.includes(option.id),
      optionId: option.id,
    }));

    if (viewMode === "rows") {
      const handleMapPinClick = (e: React.MouseEvent, optionId: string) => {
        e.stopPropagation();
        setViewMode("map");
        setSelectedOptionIdForMap(optionId);
        setTimeout(() => scrollToCard(optionId), 100);
      };
      const renderRow = (option: PreferenceOption) => (
        <div key={option.id} className={cn("border-b border-border last:border-b-0")}>
          <ScheduleListViewRow
            avatarSrc={option.logoSrc}
            avatarAlt={`${option.organizationName} logo`}
            avatarFallback={getInitials(option.hospitalLocationName)}
            title={option.siteName}
            subtitle={
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-0.5 gap-x-1 text-xs font-normal text-foreground">
                <span className="inline-flex items-center gap-2">
                  <FontAwesomeIcon
                    name="calendar"
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    weight="light"
                    aria-hidden
                  />
                  {option.dateLabel}
                </span>
                <span className="hidden sm:inline" aria-hidden> • </span>
                <button
                  type="button"
                  onClick={(e) => handleMapPinClick(e, option.id)}
                  className="inline-flex items-center gap-2 text-left text-xs font-normal hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  aria-label={`Show ${option.hospitalLocationName} on map`}
                >
                  <FontAwesomeIcon
                    name="mapPin"
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    weight="light"
                    aria-hidden
                  />
                  {option.hospitalLocationName}
                </button>
                <span className="hidden sm:inline" aria-hidden> • </span>
                <span className="inline-flex items-center gap-2">
                  <FontAwesomeIcon
                    name="bookOpen"
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    weight="light"
                    aria-hidden
                  />
                  {option.specialization}
                </span>
              </div>
            }
            trailing={
              <div className="hidden sm:flex items-center justify-end gap-1.5">
                {option.paymentRequired ? (
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal gap-1.5 bg-chart-4/10 text-chip-4 border-chip-4/40"
                  >
                    <FontAwesomeIcon name="lock" className="h-3.5 w-3.5" weight="light" aria-hidden />
                    Payment Required
                  </Badge>
                ) : null}
                <Badge variant="secondary" className="text-xs font-normal gap-1.5">
                  <FontAwesomeIcon
                    name={option.internshipType === "Group" ? "users" : "user"}
                    className="h-3.5 w-3.5"
                    weight="light"
                    aria-hidden
                  />
                  {option.internshipType}
                </Badge>
                {option.isPartner ? (
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal gap-1.5 bg-chart-2/10 text-chip-2 border-chip-2/40"
                  >
                    <FontAwesomeIcon name="handshake" className="h-3.5 w-3.5" weight="light" aria-hidden />
                    Partner
                  </Badge>
                ) : null}
              </div>
            }
            action={renderRowAction(option)}
            variant={isMobile ? "compact" : "default"}
            className="bg-background"
          />
        </div>
      );

      const hasAnyItems = GROUP_ORDER.some((g) => groupedOptions[g].length > 0);
      if (!hasAnyItems) {
        return (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          {GROUP_ORDER.map((groupId) => {
            const groupItems = groupedOptions[groupId];
            if (groupItems.length === 0) return null;
            const meta = GROUP_META[groupId];
            return (
              <div
                key={groupId}
                className={cn("rounded-xl border overflow-hidden bg-card", meta.borderClass)}
              >
                <div className={cn("flex items-center gap-2.5 px-4 py-3 border-b", meta.headerBg, meta.borderClass)}>
                  <FontAwesomeIcon
                    name={meta.icon}
                    className={cn("h-4 w-4", meta.iconClass)}
                    weight="light"
                  />
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                    {groupItems.length}
                  </Badge>
                </div>
                {groupItems.map((option) => renderRow(option))}
              </div>
            );
          })}
        </div>
      );
    }

    if (options.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 w-full min-w-0 flex-col overflow-hidden">
        {isMobile ? (
          /* Mobile: stacked — map first (fixed height), cards scroll below */
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex h-[40vh] min-h-[280px] shrink-0 flex-col overflow-hidden">
              <MapSection
                locations={optionMapLocations}
                mapHeight="fill"
                fullWidth
                className="flex-1 min-h-0 min-w-0 w-full space-y-0"
                selectedOptionId={selectedOptionIdForMap}
                hoveredOptionId={hoveredOptionIdForMap}
                onLocationSelect={(loc) => {
                  if (loc.optionId) {
                    setSelectedOptionIdForMap(loc.optionId);
                    scrollToCard(loc.optionId);
                  }
                }}
                onLocationHover={(loc) => {
                  setHoveredOptionIdForMap(loc?.optionId ?? null);
                  if (loc?.optionId) scrollToCard(loc.optionId);
                }}
                renderSelectedCard={(location, onClose) => {
                  const option = options.find((o) => o.id === location.optionId);
                  if (!option) return null;
                  const isSaved = savedPreferenceIds.includes(option.id);
                  return (
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm z-[1000]">
                      <div className="relative">
                        <InternshipCard
                          option={option}
                          isSelected
                          isSaved={isSaved}
                          onSaveClick={(e) => {
                            e.stopPropagation();
                            toggleSaved(option.id);
                          }}
                          onClick={() => {
                            setSelectedOptionIdForMap(option.id);
                            scrollToCard(option.id);
                          }}
                          onMapPinClick={() => {
                            setSelectedOptionIdForMap(option.id);
                            scrollToCard(option.id);
                          }}
                          renderActions={() => renderCardAction(option)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background z-10"
                          onClick={onClose}
                          aria-label="Close"
                        >
                          <FontAwesomeIcon name="x" className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
            <div
              ref={cardsScrollRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden border-t border-border overscroll-contain bg-background"
            >
              <div className="py-2 px-3 flex flex-col gap-4">
                {options.map((option) => {
                  const isSaved = savedPreferenceIds.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      ref={(el) => {
                        if (el) cardRefsMapRef.current[option.id] = el;
                        else delete cardRefsMapRef.current[option.id];
                      }}
                      data-option-id={option.id}
                      onMouseEnter={() => setHoveredOptionIdForMap(option.id)}
                      onMouseLeave={() => setHoveredOptionIdForMap(null)}
                    >
                      <InternshipCard
                        option={option}
                        isSelected={selectedOptionIdForMap === option.id}
                        isHovered={hoveredOptionIdForMap === option.id}
                        isSaved={isSaved}
                        onSaveClick={(event) => {
                          event.stopPropagation();
                          toggleSaved(option.id);
                        }}
                        onClick={() => setSelectedOptionIdForMap(option.id)}
                        onMapPinClick={() => {
                          setSelectedOptionIdForMap(option.id);
                          scrollToCard(option.id);
                        }}
                        renderActions={() => renderCardAction(option)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: side-by-side grid — left cards scroll, right map fills */
          <div
            className="grid min-h-0 min-w-0 flex-1 overflow-hidden"
            style={{
              gridTemplateColumns: "minmax(0, 380px) minmax(320px, 1fr)",
              gridTemplateRows: "1fr",
            }}
          >
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-border bg-background">
              <div
                ref={cardsScrollRef}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-background"
              >
                <div className="py-2 px-3 flex flex-col gap-4">
                  {options.map((option) => {
                    const isSaved = savedPreferenceIds.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        ref={(el) => {
                          if (el) cardRefsMapRef.current[option.id] = el;
                          else delete cardRefsMapRef.current[option.id];
                        }}
                        data-option-id={option.id}
                        onMouseEnter={() => setHoveredOptionIdForMap(option.id)}
                        onMouseLeave={() => setHoveredOptionIdForMap(null)}
                      >
                        <InternshipCard
                          option={option}
                          isSelected={selectedOptionIdForMap === option.id}
                          isHovered={hoveredOptionIdForMap === option.id}
                          isSaved={isSaved}
                          onSaveClick={(event) => {
                            event.stopPropagation();
                            toggleSaved(option.id);
                          }}
                          onClick={() => setSelectedOptionIdForMap(option.id)}
                          onMapPinClick={() => {
                            setSelectedOptionIdForMap(option.id);
                            scrollToCard(option.id);
                          }}
                          renderActions={() => renderCardAction(option)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
              <MapSection
                locations={optionMapLocations}
                mapHeight="fill"
                fullWidth
                className="flex-1 min-h-0 min-w-0 w-full space-y-0"
                selectedOptionId={selectedOptionIdForMap}
                hoveredOptionId={hoveredOptionIdForMap}
                onLocationSelect={(loc) => {
                  if (loc.optionId) {
                    setSelectedOptionIdForMap(loc.optionId);
                    scrollToCard(loc.optionId);
                  }
                }}
                onLocationHover={(loc) => {
                  setHoveredOptionIdForMap(loc?.optionId ?? null);
                  if (loc?.optionId) scrollToCard(loc.optionId);
                }}
                renderSelectedCard={(location, onClose) => {
                  const option = options.find((o) => o.id === location.optionId);
                  if (!option) return null;
                  const isSaved = savedPreferenceIds.includes(option.id);
                  return (
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm z-[1000]">
                      <div className="relative">
                        <InternshipCard
                          option={option}
                          isSelected
                          isSaved={isSaved}
                          onSaveClick={(e) => {
                            e.stopPropagation();
                            toggleSaved(option.id);
                          }}
                          onClick={() => {
                            setSelectedOptionIdForMap(option.id);
                            scrollToCard(option.id);
                          }}
                          onMapPinClick={() => {
                            setSelectedOptionIdForMap(option.id);
                            scrollToCard(option.id);
                          }}
                          renderActions={() => renderCardAction(option)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background z-10"
                          onClick={onClose}
                          aria-label="Close"
                        >
                          <FontAwesomeIcon name="x" className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (phase === "review") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto bg-background text-foreground">
        <div className="content-rail flex w-full flex-1 flex-col gap-6 px-4 py-4 lg:px-6">
          <div className="shrink-0">
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setPhase("preferences")} aria-label="Back to preferences">
                <FontAwesomeIcon name="arrowLeft" className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <Card
              className="flex shrink-0 flex-col overflow-hidden rounded-xl border-border bg-muted/30 w-full transition-all duration-200 pb-0 gap-4 sm:gap-6 pt-4 sm:pt-5 md:pt-6 px-4 sm:px-5 md:px-6"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Review and Submit
                    </p>
                    <h1 className="page-title truncate mt-1">{wishlistName}</h1>
                    {(item.programLabel || item.dateRange) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        {item.programLabel && (
                          <span className="flex items-center gap-1.5 truncate">
                            <FontAwesomeIcon name="bookOpen" className="h-3.5 w-3.5 shrink-0" weight="light" />
                            {item.programLabel}
                          </span>
                        )}
                        {item.dateRange && (
                          <span className="flex items-center gap-1.5 truncate">
                            <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5 shrink-0" weight="light" />
                            {formatDateRange(item.dateRange.start, item.dateRange.end)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Button
                      onClick={() => {
                        if (!canSubmit) {
                          setShowNoPreferencesDialog(true);
                          return;
                        }
                        setSubmittedAt(new Date());
                        setPhase("submitted");
                        onComplete?.();
                      }}
                  disabled={!confirmedInstructions}
                      className={cn(touchTargetMobileClasses, "md:h-10")}
                    >
                      Submit Preferences
                      <FontAwesomeIcon name="arrowRight" className="ml-2 h-4 w-4" weight="light" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="-mx-4 sm:-mx-5 md:-mx-6 border-t border-border/60 px-4 sm:px-5 md:px-6 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    id="submit-preferences-confirm-review"
                    checked={confirmedInstructions}
                    onCheckedChange={setConfirmedInstructions}
                    className="mt-0.5"
                  />
                  <label htmlFor="submit-preferences-confirm-review" className="min-w-0 cursor-pointer text-sm text-foreground">
                    I reviewed the instructions and ranked these internships based on my genuine preferences.
                  </label>
                </div>
              </div>
            </Card>
          </div>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <FontAwesomeIcon name="listOl" className="h-4 w-4 text-chip-1" weight="light" />
              <h2 className="text-base font-semibold text-foreground">Selected Preferences</h2>
            </div>
            <div className="flex flex-col gap-4">
              {selectedPreferences.map((option, index) => (
                <InternshipCard
                  key={option.id}
                  option={option}
                  headerActions={() => (
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-extrabold", RANK_CIRCLE_CLASS)}>
                        {index + 1}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          movePreference(option.id, "up");
                        }}
                        disabled={index === 0}
                        aria-label={`Move ${option.hospitalLocationName} up`}
                      >
                        <FontAwesomeIcon name="chevronUp" className="h-4 w-4" weight="light" aria-hidden />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          movePreference(option.id, "down");
                        }}
                        disabled={index === selectedPreferences.length - 1}
                        aria-label={`Move ${option.hospitalLocationName} down`}
                      >
                        <FontAwesomeIcon name="chevronDown" className="h-4 w-4" weight="light" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePreference(option.id);
                        }}
                        aria-label={`Remove ${option.hospitalLocationName} from review list`}
                      >
                        <FontAwesomeIcon name="x" className="h-4 w-4" weight="light" aria-hidden />
                      </Button>
                    </div>
                  )}
                  footerContent={() => (
                    <div className="space-y-2 pt-1">
                      <label htmlFor={`preference-why-${option.id}`} className="text-sm font-medium text-foreground">
                        Why this preference?
                      </label>
                      <Textarea
                        id={`preference-why-${option.id}`}
                        placeholder="Add a short note about why this internship fits your goals, location, or learning priorities."
                        value={preferenceReasons[option.id] ?? ""}
                        onChange={(event) =>
                          setPreferenceReasons((current) => ({
                            ...current,
                            [option.id]: event.target.value,
                          }))
                        }
                        className="min-h-24"
                      />
                    </div>
                  )}
                />
              ))}
            </div>
          </section>

        </div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto bg-background text-foreground">
        <div className="content-rail flex w-full flex-1 items-center justify-center px-4 py-6 lg:px-6">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6 py-8 text-center">
            <div
              className="w-full max-w-[360px] rounded-xl"
              style={{ boxShadow: "var(--shadow-chart-accent-glow)" }}
            >
              <WishlistCard
                item={submittedWishlistItem}
                hideCta
                className="w-full rounded-xl border-2 border-chart-2 bg-chart-2/15"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1.5 border-chart-2/40 bg-chart-2/10 text-chip-2"
              >
                <FontAwesomeIcon name="listOl" className="h-3.5 w-3.5" weight="light" aria-hidden />
                {selectedPreferences.length} preferences submitted
              </Badge>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">
                Preferences Submitted!
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Your {selectedPreferences.length} ranked internship preferences for {wishlistName} have been sent successfully.
              </p>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <Button variant="default" className="flex-1" onClick={resetAndBack}>
                View Wishlist
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPhase("review")}>
                Review Submitted Rankings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "all" | "ranked" | "saved")}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
    <div
      className={cn(
        "flex flex-1 min-h-0 flex-col bg-background text-foreground overflow-hidden",
        viewMode === "map" && "map-full-bleed"
      )}
    >
      <div
        className={cn(
          "content-rail flex w-full flex-1 flex-col min-h-0 py-4 lg:py-6",
          viewMode === "map" ? "overflow-hidden px-0" : "px-4 lg:px-6"
        )}
      >
        {/* Back button + card — inset when map for full-bleed map below */}
        <div className={cn("shrink-0", viewMode === "map" && "px-4 lg:px-6")}>
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to wishlist">
            <FontAwesomeIcon name="arrowLeft" className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/* Top card — schedule-detail style, shrinks on scroll */}
        <Card
          className={cn(
            "flex shrink-0 flex-col overflow-hidden rounded-xl border-border bg-muted/30 w-full transition-all duration-200 pb-0",
            isScrolled ? "gap-2 pt-3 sm:pt-4 px-3 sm:px-4" : "gap-4 sm:gap-6 pt-4 sm:pt-5 md:pt-6 px-4 sm:px-5 md:px-6"
          )}
        >
          {/* Row 1: Wishlist name + meta + actions */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1
                  className={cn(
                    "truncate",
                    isScrolled ? "text-base font-semibold" : "text-xl sm:text-2xl md:page-title font-display font-bold"
                  )}
                >
                  {wishlistName}
                </h1>
                {!isScrolled && (item.programLabel || item.dateRange) && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 gap-x-6 mt-0.5 sm:mt-1.5 text-xs text-foreground">
                    {item.programLabel && (
                      <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <FontAwesomeIcon name="bookOpen" className="h-3.5 w-3.5 shrink-0" weight="light" />
                        {item.programLabel}
                      </span>
                    )}
                    {item.dateRange && (
                      <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5 shrink-0" weight="light" />
                        {formatDateRange(item.dateRange.start, item.dateRange.end)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap shrink-0 items-center gap-2 sm:gap-4">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-sm font-medium"
                  onClick={onViewInstructions}
                  disabled={!onViewInstructions}
                >
                  View Instructions
                </Button>
                <Button
                  onClick={goToReview}
                  className={cn(touchTargetMobileClasses, "md:h-10")}
                >
                  Review Now
                  <FontAwesomeIcon name="arrowRight" className="ml-2 h-4 w-4" weight="light" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs + view switcher */}
            <div
              className={cn(
                "flex h-12 w-full items-end justify-between gap-2 -mb-2",
                isScrolled ? "px-0" : "px-0"
              )}
            >
              <div
                role="tablist"
                aria-label="Internship sections"
                className={cn(
                  "flex h-12 flex-1 min-w-0 items-end justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  "-mx-4 sm:-mx-5 md:-mx-6 pl-0 pr-2"
                )}
              >
                <TabsList variant="underline" className="w-full justify-start border-b-0 md:w-auto h-full bg-transparent p-0">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="ranked">Ranked</TabsTrigger>
                  <TabsTrigger value="saved">Saved</TabsTrigger>
                </TabsList>
              </div>
              <ButtonGroup aria-label="Internship view options" className="shrink-0 pb-2">
                {(
                  [
                    { id: "rows", icon: "listChecks" as const, label: "Internship rows" },
                    { id: "map", icon: "mapPin" as const, label: "Map with cards" },
                  ] as const
                ).map((view) => (
                  <Tooltip key={view.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={view.label}
                        aria-pressed={viewMode === view.id}
                        onClick={() => setViewMode(view.id)}
                        className={viewMode === view.id ? "bg-accent text-accent-foreground" : ""}
                      >
                        <FontAwesomeIcon
                          name={view.icon}
                          className="h-4 w-4"
                          weight={viewMode === view.id ? "solid" : "light"}
                          aria-hidden="true"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{view.label}</TooltipContent>
                  </Tooltip>
                ))}
              </ButtonGroup>
            </div>
        </Card>
        </div>

        {viewMode === "map" ? (
          <div className="map-view-fill flex flex-1 min-h-0 flex-col overflow-hidden pt-4">
            <div className="px-4 lg:px-6 shrink-0">
              <FilterBar
                filterConfigs={filterConfigs}
                activeFilters={activeFilters}
                onAddFilter={handleAddFilter}
                onToggleFilterValue={handleToggleFilterValue}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                resultsCount={filteredOptions.length}
                resultsLabel="Internships found"
                className="pt-0"
                afterResultsContent={
                  isSearchOpen || searchQuery ? (
                    <InputGroup
                      className="h-9 w-full max-w-md rounded-full border border-border bg-background md:w-[340px]"
                      style={{ borderColor: "var(--control-border)" }}
                    >
                      <InputGroupInput
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search site, internship, specialization, or program"
                        className="h-full text-sm pl-3 border-0"
                        aria-label="Search internships"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                          aria-label="Clear internship search"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      <InputGroupAddon align="inline-end" className="pl-1 pr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                          aria-label="Close internship search"
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchOpen(false);
                          }}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-full gap-2 shrink-0"
                      onClick={() => setIsSearchOpen(true)}
                      aria-label="Open internship search"
                    >
                      <FontAwesomeIcon name="search" className="h-4 w-4" weight="light" aria-hidden />
                      Search
                    </Button>
                  )
                }
              />
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
              {activeTab === "all"
                ? renderOptionsContent(filteredOptions, "No internships match your current search or filters.")
                : activeTab === "ranked"
                  ? renderOptionsContent(
                      filteredOptions,
                      selectedPreferences.length === 0
                        ? "Add internships from the All tab to build your ranked list."
                        : "No ranked internships match your current search or filters."
                    )
                  : renderOptionsContent(
                      filteredOptions,
                      savedPreferenceIds.length === 0
                        ? "No saved internships yet."
                        : "No saved internships match your current search or filters."
                    )}
            </div>

          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-visible pt-4"
          >
            <div className="flex min-h-full flex-col gap-4">
              <div className="mt-4 flex flex-1 min-h-0 flex-col gap-4">
                <FilterBar
                  filterConfigs={filterConfigs}
                  activeFilters={activeFilters}
                  onAddFilter={handleAddFilter}
                  onToggleFilterValue={handleToggleFilterValue}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                  resultsCount={filteredOptions.length}
                  resultsLabel="Internships found"
                  className="pt-0"
                  afterResultsContent={
                    isSearchOpen || searchQuery ? (
                      <InputGroup
                        className="h-9 w-full max-w-md rounded-full border border-border bg-background md:w-[340px]"
                        style={{ borderColor: "var(--control-border)" }}
                      >
                        <InputGroupInput
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search site, internship, specialization, or program"
                          className="h-full text-sm pl-3 border-0"
                          aria-label="Search internships"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                            aria-label="Clear internship search"
                            onClick={() => setSearchQuery("")}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        )}
                        <InputGroupAddon align="inline-end" className="pl-1 pr-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                            aria-label="Close internship search"
                            onClick={() => {
                              setSearchQuery("");
                              setIsSearchOpen(false);
                            }}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-full gap-2 shrink-0"
                        onClick={() => setIsSearchOpen(true)}
                        aria-label="Open internship search"
                      >
                        <FontAwesomeIcon name="search" className="h-4 w-4" weight="light" aria-hidden />
                        Search
                      </Button>
                    )
                  }
                />

                <TabsContent
                  value="all"
                  className="m-0 flex flex-1 min-h-0 flex-col overflow-auto"
                >
                  {renderOptionsContent(filteredOptions, "No internships match your current search or filters.")}
                </TabsContent>

                <TabsContent
                  value="ranked"
                  className="m-0 flex flex-1 min-h-0 flex-col overflow-auto"
                >
                  {renderOptionsContent(
                    filteredOptions,
                    selectedPreferences.length === 0
                      ? "Add internships from the All tab to build your ranked list."
                      : "No ranked internships match your current search or filters."
                  )}
                </TabsContent>

                <TabsContent
                  value="saved"
                  className="m-0 flex flex-1 min-h-0 flex-col overflow-auto"
                >
                  {renderOptionsContent(
                    filteredOptions,
                    savedPreferenceIds.length === 0
                      ? "No saved internships yet."
                      : "No saved internships match your current search or filters."
                  )}
                </TabsContent>
              </div>

            </div>
          </div>
        )}
      </div>

      <Dialog open={showNoPreferencesDialog} onOpenChange={setShowNoPreferencesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rank preferences required</DialogTitle>
            <DialogDescription>
              {selectedPreferenceIds.length < MIN_PREFERENCES_REQUIRED
                ? `Please rank at least ${MIN_PREFERENCES_REQUIRED} internships before reviewing. Add internships from the All tab and use the Add button to build your ranked list.`
                : "Please confirm you've reviewed the instructions and ranked these internships based on your genuine preferences."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowNoPreferencesDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Tabs>
  );
}
