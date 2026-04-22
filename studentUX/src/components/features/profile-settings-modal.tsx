"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, AvatarPlaceholderIcon } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, type ProgressVariant } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon, type IconName } from "@/components/brand/font-awesome-icon";
import { TaskItem } from "@/components/shared/task-item";
import { cn } from "@/components/ui/utils";
import { useProfileStore } from "@/stores/profile-store";
import { sidebarData } from "@/components/layout/sidebar-data";
import { useAppStore } from "@/stores/app-store";
import { ProfileSectionEmptyState } from "@/components/features/profile-section-empty-state";
import {
  ProfileCardDialog,
  type ProfileCardSectionId,
} from "@/components/features/profile-card-dialog";
import { ScrollCarouselButtons } from "@/components/shared/scroll-carousel";
import { useIsMobile } from "@/components/ui/use-mobile";

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Information" },
  { id: "address", label: "Address Information" },
  { id: "summary", label: "Professional Summary" },
  { id: "interest", label: "Professional Interest" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "clinical", label: "Clinical Experience" },
  { id: "work", label: "Work Experience" },
  { id: "memberships", label: "Memberships" },
  { id: "licensures", label: "Licensures" },
  { id: "accomplishments", label: "Accomplishments" },
  { id: "veteran", label: "Veteran Status" },
  { id: "resume", label: "Resume" },
  { id: "jobPreferences", label: "Job Preferences" },
] as const;

/** Empty state messages per section */
const SECTION_EMPTY_MESSAGES: Record<string, { message: string; description?: string }> = {
  personal: { message: "No personal information added yet", description: "Add your contact details and preferences." },
  address: { message: "No address added", description: "Add your current and permanent address." },
  summary: { message: "No professional summary", description: "Write a brief summary of your experience and goals." },
  interest: { message: "No professional interests", description: "Add interests to help match you with fitting roles." },
  skills: { message: "No skills added", description: "Showcase your technical and soft skills." },
  education: { message: "No education added", description: "Add your degrees and certifications." },
  clinical: { message: "No clinical experience", description: "Add your rotations and clinical hours." },
  work: { message: "No work experience", description: "Add your relevant work history." },
  memberships: { message: "No memberships", description: "Add professional organization memberships." },
  licensures: { message: "No licensures", description: "Add your licenses and certifications." },
  accomplishments: { message: "No accomplishments", description: "Add publications, awards, and achievements." },
  veteran: { message: "Veteran status not specified", description: "Add your veteran status if applicable." },
  resume: { message: "No resume uploaded", description: "Upload your resume to help employers learn about you." },
  jobPreferences: { message: "No job preferences", description: "Add preferences to get matched to relevant opportunities." },
};

/** Menu options per section: 1=Go to account setting, 2=Add New, 3=Edit mode */
const SECTION_MENU_OPTIONS: Record<string, { goToAccountSetting?: boolean; addNew?: boolean; editMode?: boolean }> = {
  personal: { goToAccountSetting: true },
  address: { addNew: true, editMode: true },
  summary: { editMode: true },
  interest: { addNew: true, editMode: true },
  skills: { addNew: true, editMode: true },
  education: { addNew: true, editMode: true },
  clinical: { addNew: true, editMode: true },
  work: { addNew: true, editMode: true },
  memberships: { addNew: true, editMode: true },
  licensures: { addNew: true, editMode: true },
  accomplishments: { addNew: true, editMode: true },
  veteran: { editMode: true },
  resume: { addNew: true },
  jobPreferences: { editMode: true },
};

const DIRECT_DIALOG_EDIT_SECTIONS = new Set<ProfileCardSectionId>([
  "summary",
  "interest",
  "veteran",
  "jobPreferences",
]);

/** Completion items config — completed is derived from section empty state */
const PROFILE_COMPLETION_CONFIG = [
  { id: "personal", label: "Personal Information" },
  { id: "address", label: "Address Information" },
  { id: "summary", label: "Professional Summary" },
  { id: "interest", label: "Professional Interest" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "clinical", label: "Clinical Experience" },
  { id: "work", label: "Work Experience" },
  { id: "memberships", label: "Memberships" },
  { id: "licensures", label: "Licensures" },
  { id: "accomplishments", label: "Accomplishments" },
  { id: "veteran", label: "Veteran Status" },
  { id: "resume", label: "Resume" },
  { id: "jobPreferences", label: "Career Preferences" },
] as const;

type ProfileSectionEmptyOverrides = Partial<
  Record<"personal" | ProfileCardSectionId, boolean>
>;

/** Computes whether each profile section is empty (for empty state display) */
function useProfileSectionEmpty(
  forceAllEmpty?: boolean,
  overrides?: ProfileSectionEmptyOverrides
) {
  const profile = useProfileStore((s) => s.profile);
  return React.useMemo(() => {
    const d = profile;
    const isPersonalEmpty = !d.personal.primaryEmail && !d.personal.phoneNumber && !d.personal.preferredName;
    const isAddressEmpty =
      (!d.currentAddress.addressLine1 && !d.currentAddress.city) &&
      (!d.permanentAddress.addressLine1 && !d.permanentAddress.city);
    const isSummaryEmpty = !d.professionalSummary?.trim();
    const isInterestEmpty = d.professionalInterests.length === 0;
    const isSkillsEmpty =
      d.skills.technical.length === 0 &&
      d.skills.others.length === 0 &&
      d.skills.languages.length === 0;
    const isEducationEmpty = d.education.length === 0;
    const isClinicalEmpty = d.clinicalExperience.length === 0;
    const isWorkEmpty = d.workExperience.length === 0;
    const isMembershipsEmpty = d.memberships.length === 0;
    const isLicensuresEmpty = d.licensures.length === 0;
    const isAccomplishmentsEmpty =
      d.accomplishments.publications.length === 0 && d.accomplishments.awards.length === 0;
    const isVeteranEmpty = false; /* Veteran status typically always has a value */
    const isResumeEmpty = !d.resume;
    const isJobPrefsEmpty = !d.jobPreferences;

    const computed = {
      personal: isPersonalEmpty,
      address: isAddressEmpty,
      summary: isSummaryEmpty,
      interest: isInterestEmpty,
      skills: isSkillsEmpty,
      education: isEducationEmpty,
      clinical: isClinicalEmpty,
      work: isWorkEmpty,
      memberships: isMembershipsEmpty,
      licensures: isLicensuresEmpty,
      accomplishments: isAccomplishmentsEmpty,
      veteran: isVeteranEmpty,
      resume: isResumeEmpty,
      jobPreferences: isJobPrefsEmpty,
    };

    if (!forceAllEmpty) {
      return computed;
    }

    return {
      personal: overrides?.personal ?? true,
      address: overrides?.address ?? true,
      summary: overrides?.summary ?? true,
      interest: overrides?.interest ?? true,
      skills: overrides?.skills ?? true,
      education: overrides?.education ?? true,
      clinical: overrides?.clinical ?? true,
      work: overrides?.work ?? true,
      memberships: overrides?.memberships ?? true,
      licensures: overrides?.licensures ?? true,
      accomplishments: overrides?.accomplishments ?? true,
      veteran: overrides?.veteran ?? true,
      resume: overrides?.resume ?? true,
      jobPreferences: overrides?.jobPreferences ?? true,
    };
  }, [forceAllEmpty, overrides, profile]);
}

export interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
    /** Shown in header when forceAllEmpty (e.g. "Doctor of Physical Therapy") */
    discipline?: string;
    /** Shown in header when forceAllEmpty (e.g. "2025") */
    graduationYear?: string;
  };
  /** "onboarding" shows Save and Continue footer, hides Download PDF, different header actions */
  variant?: "default" | "onboarding";
  /** Called when Save and Continue is clicked (required when variant is "onboarding") */
  onSaveAndContinue?: () => void;
  /** When true, all sections show empty state (for onboarding) */
  forceAllEmpty?: boolean;
}

export function ProfileSectionCard({
  title,
  icon,
  children,
  hint,
  cardClassName,
  completionHint,
  section,
  sectionId,
  onAddDetails,
  onEditMode,
  onDoneEditing,
  onGoToAccountSetting,
  isEditMode = false,
  isEmpty,
  emptyStateMessage,
  emptyStateDescription,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
  hint?: string;
  cardClassName?: string;
  completionHint?: string;
  section?: string;
  sectionId?: string;
  onAddDetails?: (sectionId: string) => void;
  onEditMode?: (sectionId: string) => void;
  onDoneEditing?: (sectionId: string) => void;
  onGoToAccountSetting?: () => void;
  isEditMode?: boolean;
  /** When true, shows empty state and menu shows only Add new */
  isEmpty?: boolean;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}) {
  const baseOpts = sectionId ? SECTION_MENU_OPTIONS[sectionId] : undefined;
  const opensDialogDirectly = sectionId
    ? DIRECT_DIALOG_EDIT_SECTIONS.has(sectionId as ProfileCardSectionId)
    : false;
  const menuOpts = isEmpty
    ? (sectionId === "personal"
        ? { goToAccountSetting: true, addNew: false, editMode: false }
        : { addNew: true, goToAccountSetting: false, editMode: false })
    : baseOpts;
  const showMenu = menuOpts && (menuOpts.goToAccountSetting || menuOpts.addNew || menuOpts.editMode);

  const handleAddDetails = () => sectionId && onAddDetails?.(sectionId);
  const handleEditMode = () => sectionId && onEditMode?.(sectionId);
  const handleDoneEditing = () => sectionId && onDoneEditing?.(sectionId);

  return (
    <Card className={cardClassName}>
      <CardHeader>
        {section && (
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {section}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <FontAwesomeIcon name={icon} className="h-5 w-5 text-muted-foreground shrink-0" weight="regular" />
            )}
            <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
          </div>
          {showMenu && (
            isEmpty ? (
              menuOpts?.goToAccountSetting ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 shrink-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0"
                  onClick={onGoToAccountSetting}
                  aria-label={`Go to settings for ${title}`}
                >
                  <FontAwesomeIcon name="gear" className="h-4 w-4" weight="light" aria-hidden />
                  Go to settings
                </Button>
              ) : menuOpts?.addNew ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 shrink-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0"
                  onClick={handleAddDetails}
                  aria-label={`Add ${title}`}
                >
                  <FontAwesomeIcon name="plus" className="h-4 w-4" weight="light" aria-hidden />
                  Add
                </Button>
              ) : null
            ) : isEditMode ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={handleDoneEditing}
                aria-label={`Done editing ${title}`}
              >
                <FontAwesomeIcon name="check" className="h-4 w-4" weight="light" aria-hidden />
                Done
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11 md:h-8 md:w-8 shrink-0"
                    aria-label="Open section menu"
                  >
                    <FontAwesomeIcon name="ellipsisVertical" className="h-4 w-4" weight="light" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuOpts?.goToAccountSetting && (
                    <DropdownMenuItem onClick={onGoToAccountSetting}>
                      <FontAwesomeIcon name="gear" className="h-4 w-4" weight="light" aria-hidden />
                      Go to account setting
                    </DropdownMenuItem>
                  )}
                  {menuOpts?.addNew && (
                    <DropdownMenuItem onClick={handleAddDetails}>
                      <FontAwesomeIcon name="plus" className="h-4 w-4" weight="light" aria-hidden />
                      Add new
                    </DropdownMenuItem>
                  )}
                  {menuOpts?.editMode && (
                    <DropdownMenuItem onClick={handleEditMode}>
                      <FontAwesomeIcon name="edit" className="h-4 w-4" weight="light" aria-hidden />
                      {opensDialogDirectly ? "Edit" : "Edit mode"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && icon && emptyStateMessage ? (
          <ProfileSectionEmptyState
            icon={icon}
            message={emptyStateMessage}
            description={emptyStateDescription}
          />
        ) : (
          children
        )}
        {!isEmpty && hint && (
          <p className="text-xs text-primary">{hint}</p>
        )}
        {completionHint && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <FontAwesomeIcon name="starChristmas" className="h-4 w-4 text-primary shrink-0 mt-0.5" weight="solid" />
            <p className="text-xs text-foreground">{completionHint}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function SectionInlineEditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-sm"
      onClick={onClick}
      aria-label={`Edit ${label}`}
    >
      <FontAwesomeIcon name="edit" className="h-4 w-4" weight="light" aria-hidden />
      Edit
    </Button>
  );
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
  user,
  variant = "default",
  onSaveAndContinue,
  forceAllEmpty = false,
}: ProfileSettingsModalProps) {
  const isOnboarding = variant === "onboarding";
  const profile = useProfileStore((s) => s.profile);
  const [sectionEmptyOverrides, setSectionEmptyOverrides] = React.useState<ProfileSectionEmptyOverrides>({});
  const sectionEmpty = useProfileSectionEmpty(forceAllEmpty, sectionEmptyOverrides);
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = React.useState("personal");
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [hasContentBelow, setHasContentBelow] = React.useState(false);
  const [tabCanScrollLeft, setTabCanScrollLeft] = React.useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [editingSections, setEditingSections] = React.useState<Partial<Record<ProfileCardSectionId, boolean>>>({});

  const updateTabScroll = React.useCallback(() => {
    const el = tabListRef.current;
    if (!el) return;
    setTabCanScrollLeft(el.scrollLeft > 4);
    setTabCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrolled(el.scrollTop > 80);
    setHasContentBelow(el.scrollTop > 0);

    // Scroll spy: update active tab based on which section is in view
    const scrollRect = el.getBoundingClientRect();
    const visibleTop = scrollRect.top + 80;
    let bestId = PROFILE_SECTIONS[0].id;
    for (let i = PROFILE_SECTIONS.length - 1; i >= 0; i--) {
      const sectionEl = sectionRefs.current[PROFILE_SECTIONS[i].id];
      if (!sectionEl) continue;
      const rect = sectionEl.getBoundingClientRect();
      if (rect.top <= visibleTop) {
        bestId = PROFILE_SECTIONS[i].id;
        break;
      }
    }
    setActiveSection(bestId);
  }, []);

  const scrollToSection = React.useCallback((id: string) => {
    setActiveSection(id);
    const scrollEl = scrollRef.current;
    const sectionEl = sectionRefs.current[id];
    if (scrollEl && sectionEl) {
      const scrollRect = scrollEl.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const targetScrollTop = scrollEl.scrollTop + (sectionRect.top - scrollRect.top);
      scrollEl.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }
  }, []);

  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    sectionId: ProfileCardSectionId;
    mode: "add" | "edit";
    editAddressType?: "current" | "permanent";
    editItemIndex?: number;
    editSkillType?: "technical" | "other" | "language";
  } | null>(null);

  const handleAddDetails = React.useCallback((sectionId: string) => {
    setDialogState({
      open: true,
      sectionId: sectionId as ProfileCardSectionId,
      mode: "add",
    });
    scrollToSection(sectionId);
  }, [scrollToSection]);

  const handleEditMode = React.useCallback((sectionId: string) => {
    if (DIRECT_DIALOG_EDIT_SECTIONS.has(sectionId as ProfileCardSectionId)) {
      setDialogState({
        open: true,
        sectionId: sectionId as ProfileCardSectionId,
        mode: "edit",
      });
      scrollToSection(sectionId);
      return;
    }

    setEditingSections((current) => ({
      ...current,
      [sectionId]: true,
    }));
    scrollToSection(sectionId);
  }, [scrollToSection]);

  const handleDoneEditing = React.useCallback((sectionId: string) => {
    setEditingSections((current) => ({
      ...current,
      [sectionId]: false,
    }));
  }, []);

  const handleOpenEditDialog = React.useCallback((
    sectionId: ProfileCardSectionId,
    options?: {
      editAddressType?: "current" | "permanent";
      editItemIndex?: number;
      editSkillType?: "technical" | "other" | "language";
    }
  ) => {
    setDialogState({
      open: true,
      sectionId,
      mode: "edit",
      editAddressType: options?.editAddressType,
      editItemIndex: options?.editItemIndex,
      editSkillType: options?.editSkillType,
    });
    scrollToSection(sectionId);
  }, [scrollToSection]);

  const markSectionAsCompleted = React.useCallback(
    (sectionId: ProfileCardSectionId, data: Record<string, unknown>) => {
      if (!forceAllEmpty) return;

      const hasMeaningfulValue = (value: unknown): boolean => {
        if (typeof value === "string") return value.trim().length > 0;
        if (typeof value === "number" || typeof value === "boolean") return true;
        if (Array.isArray(value)) return value.some(hasMeaningfulValue);
        if (value && typeof value === "object") return Object.values(value).some(hasMeaningfulValue);
        return false;
      };

      const shouldMarkCompleted = hasMeaningfulValue(data);

      if (!shouldMarkCompleted) return;

      setSectionEmptyOverrides((current) => ({
        ...current,
        [sectionId]: false,
      }));
    },
    [forceAllEmpty]
  );

  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const handleGoToAccountSetting = React.useCallback(() => {
    onOpenChange(false);
    navigateToPage("Settings");
  }, [onOpenChange, navigateToPage]);

  React.useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
      setIsScrolled(false);
      setHasContentBelow(false);
    } else {
      setEditingSections({});
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    updateTabScroll();
    const el = tabListRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateTabScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, updateTabScroll]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-transparent"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
        }}
        style={{
          top: "4rem",
          bottom: "0",
          left: "0.5rem",
          right: "0.5rem",
          maxHeight: "calc(100vh - 4rem)",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-modal-deep)",
        }}
        className="flex flex-col gap-0 p-0 border w-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{isOnboarding ? "Build your profile" : "Profile Settings"}</SheetTitle>
        </SheetHeader>
        {/* iOS-style drag handle */}
        <div className="relative z-10 flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <div className="flex flex-col flex-1 min-h-0 gap-0 pt-2 px-4 lg:pt-4 lg:px-6">
          {/* Header - card shrinks on scroll, shadow when content below */}
          <Card
            className={cn(
              "relative z-10 flex shrink-0 flex-col overflow-hidden rounded-xl border-border pb-0 w-full transition-all duration-200",
              isScrolled ? "gap-2 p-3 sm:p-4 pb-0" : "gap-4 sm:gap-6 p-4 sm:p-5 md:p-6 pb-0",
              hasContentBelow && "shadow-md"
            )}
            style={{
              background: "linear-gradient(180deg, transparent 0%, var(--background) 60%), linear-gradient(135deg, color-mix(in oklab, var(--chart-1) 15%, transparent) 0%, color-mix(in oklab, var(--chart-2) 12%, transparent) 40%, color-mix(in oklab, var(--chart-3) 10%, transparent) 70%, color-mix(in oklab, var(--chart-4) 8%, transparent) 100%)",
              paddingBottom: 0,
            }}
          >
            {/* Row 1: Avatar + (Name when scrolled) + Download/Close button */}
            <div className={cn("flex items-start justify-between gap-4 w-full", isScrolled && "items-center")}>
              <div className={cn("flex h-fit gap-3 min-w-0", isScrolled && "items-center flex-1")}>
                <div
                  className={cn(
                    "relative shrink-0 aspect-square rounded-full overflow-hidden flex items-center justify-center",
                    isScrolled
                      ? "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                      : "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36",
                    isOnboarding && "bg-chip-filled-1"
                  )}
                >
                  {isOnboarding ? (
                    <div className="relative flex items-center justify-center size-full">
                      <AvatarPlaceholderIcon
                        className="absolute inset-0 size-full p-0"
                        fillColor="color-mix(in oklch, var(--chart-1) 25%, transparent)"
                      />
                      <span
                        className={cn(
                          "relative z-10 flex items-center justify-center text-chart-1",
                          isScrolled ? "text-xl" : "text-4xl"
                        )}
                      >
                        <FontAwesomeIcon name="user" weight="solid" aria-hidden="true" />
                      </span>
                    </div>
                  ) : (
                    <>
                      <Avatar className="h-full w-full rounded-full overflow-hidden">
                        <AvatarImage
                          src={sidebarData.user.avatar}
                          alt={sidebarData.user.name}
                          className="object-cover h-full w-full"
                        />
                        <AvatarFallback className={cn("h-full w-full", isScrolled ? "text-sm" : "text-xl")}>
                          {sidebarData.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!isScrolled && (
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 flex min-h-11 min-w-11 md:h-8 md:w-8 items-center justify-center rounded-md border border-border bg-background shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Change profile photo"
                        >
                          <FontAwesomeIcon name="camera" className="h-4 w-4 text-foreground" weight="solid" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {isScrolled && (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h1 className="font-display text-base font-semibold truncate">{user.name}</h1>
                    {!forceAllEmpty && (
                      <span className="text-xs text-muted-foreground shrink-0">{profile.personal.pronouns}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isScrolled && !isOnboarding && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <FontAwesomeIcon name="download" className="h-4 w-4" />
                    Download as PDF
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onOpenChange(false)}
                  aria-label={isOnboarding ? "Skip profile setup" : "Close profile settings"}
                >
                  <FontAwesomeIcon name="circleXmark" className="text-2xl" weight="solid" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Meta + tabs: reduced gap between them */}
            <div className="flex flex-col gap-2">
              {/* Row 2: Name + details (hidden when compact) */}
              {!isScrolled && (
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="page-title truncate">{user.name}</h1>
                    {!forceAllEmpty && (
                      <span className="text-xs text-muted-foreground font-normal">{profile.personal.pronouns}</span>
                    )}
                  </div>
                  {/* Row 3: forceAllEmpty = Name, Discipline, Graduation year | else = Degree, Location, University */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-foreground">
                    {forceAllEmpty ? (
                      <>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon name="bookOpen" className="h-4 w-4 shrink-0" />
                          {user.discipline ?? "—"}
                        </span>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon name="calendar" className="h-4 w-4 shrink-0" />
                          {user.graduationYear ?? "—"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon name="bookOpen" className="h-4 w-4 shrink-0" />
                          Doctor of Physical Therapy (DPT)
                        </span>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon name="mapPin" className="h-4 w-4 shrink-0" />
                          {profile.currentAddress.city}, {profile.currentAddress.stateTerritory}, {profile.currentAddress.country}
                        </span>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon name="school" className="h-4 w-4 shrink-0" />
                          {profile.education[0]?.school ?? "—"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Section nav - tabs always visible, with carousel arrows when overflow */}
              <div className={cn("flex items-center gap-2 -mb-2 min-w-0", isScrolled ? "-mx-4 pl-0 pr-4" : "-mx-6 pl-0 pr-6")}>
                <div
                  ref={tabListRef}
                  role="tablist"
                  aria-label="Profile sections"
                  onScroll={updateTabScroll}
                  className="flex h-12 flex-1 min-w-0 items-center justify-start gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {PROFILE_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`${section.id}-section`}
                        id={`tab-${section.id}`}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "relative inline-flex h-full min-w-0 shrink-0 items-center justify-center whitespace-nowrap rounded-none px-3 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        style={isActive ? { borderBottom: "2px solid var(--primary)" } : undefined}
                      >
                        {section.label}
                      </button>
                    );
                  })}
                </div>
                {!isMobile && (
                  <ScrollCarouselButtons
                    canScrollLeft={tabCanScrollLeft}
                    canScrollRight={tabCanScrollRight}
                    onScrollLeft={() =>
                      tabListRef.current?.scrollBy({ left: -200, behavior: "smooth" })
                    }
                    onScrollRight={() =>
                      tabListRef.current?.scrollBy({ left: 200, behavior: "smooth" })
                    }
                    isMobile={isMobile}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Two-column layout: main content left + Profile Completion right */}
          <div className="flex flex-1 min-h-0 h-0 overflow-hidden gap-6 flex-row pt-2 pb-2">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="relative z-0 flex-1 min-w-0 min-h-0 overflow-y-auto pl-0 pr-4 pt-0 pb-0 lg:pr-6"
            >
              <div className="w-full space-y-6">
                {/* 1. Personal Information */}
                <div ref={(el) => { sectionRefs.current.personal = el; }} id="personal-section">
                  <ProfileSectionCard
                    title="Personal Information"
                    icon="user"
                    sectionId="personal"
                    onGoToAccountSetting={handleGoToAccountSetting}
                    onAddDetails={sectionEmpty.personal ? () => handleGoToAccountSetting() : undefined}
                    isEmpty={sectionEmpty.personal}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.personal.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.personal.description}
                    completionHint="Complete contact info helps employers reach you quickly."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReadOnlyField label="Preferred Name" value={profile.personal.preferredName} />
                      <ReadOnlyField label="Pronouns" value={profile.personal.pronouns} />
                      <ReadOnlyField label="Year of Birth" value={profile.personal.yearOfBirth} />
                      <ReadOnlyField label="Primary Email" value={profile.personal.primaryEmail} />
                      <ReadOnlyField label="Phone Number" value={profile.personal.phoneNumber} />
                      <ReadOnlyField label="NPI (National Provider Identifier)" value={profile.personal.npi} />
                      <div className="sm:col-span-2">
                        <ReadOnlyField label="Emergency Contact" value={profile.personal.emergencyContact} />
                      </div>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 2. Address Information */}
                <div ref={(el) => { sectionRefs.current.address = el; }} id="address-section">
                  <ProfileSectionCard
                    title="Address Information"
                    icon="mapPin"
                    sectionId="address"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.address)}
                    isEmpty={sectionEmpty.address}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.address.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.address.description}
                    completionHint="Accurate address ensures smooth credential verification."
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Badge variant="secondary" className="rounded-full text-xs">Current Address</Badge>
                          {editingSections.address && (
                            <SectionInlineEditButton
                              label="current address"
                              onClick={() => handleOpenEditDialog("address", { editAddressType: "current" })}
                            />
                          )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ReadOnlyField label="Address Line 1" value={profile.currentAddress.addressLine1} />
                          <ReadOnlyField label="Address Line 2" value={profile.currentAddress.addressLine2} />
                          <ReadOnlyField label="City" value={profile.currentAddress.city} />
                          <ReadOnlyField label="State/Territory" value={profile.currentAddress.stateTerritory} />
                          <ReadOnlyField label="ZIP Code" value={profile.currentAddress.zipCode} />
                          <ReadOnlyField label="Country" value={profile.currentAddress.country} />
                        </div>
                      </div>
                      <div className="pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Badge variant="secondary" className="rounded-full text-xs">Permanent Address</Badge>
                          {editingSections.address && (
                            <SectionInlineEditButton
                              label="permanent address"
                              onClick={() => handleOpenEditDialog("address", { editAddressType: "permanent" })}
                            />
                          )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ReadOnlyField label="Address Line 1" value={profile.permanentAddress.addressLine1} />
                          <ReadOnlyField label="Address Line 2" value={profile.permanentAddress.addressLine2} />
                          <ReadOnlyField label="City" value={profile.permanentAddress.city} />
                          <ReadOnlyField label="State/Territory" value={profile.permanentAddress.stateTerritory} />
                          <ReadOnlyField label="ZIP Code" value={profile.permanentAddress.zipCode} />
                          <ReadOnlyField label="Country" value={profile.permanentAddress.country} />
                        </div>
                      </div>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 3. Professional Summary */}
                <div ref={(el) => { sectionRefs.current.summary = el; }} id="summary-section">
                  <ProfileSectionCard
                    title="Professional Summary"
                    icon="fileText"
                    sectionId="summary"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.summary)}
                    isEmpty={sectionEmpty.summary}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.summary.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.summary.description}
                    completionHint="A strong summary attracts 3x more employer views."
                  >
                    <div className="space-y-3">
                      {editingSections.summary && (
                        <div className="flex justify-end">
                          <SectionInlineEditButton
                            label="professional summary"
                            onClick={() => handleOpenEditDialog("summary")}
                          />
                        </div>
                      )}
                      <p className="text-sm text-foreground">
                        {profile.professionalSummary}
                      </p>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 4. Professional Interest */}
                <div ref={(el) => { sectionRefs.current.interest = el; }} id="interest-section">
                  <ProfileSectionCard
                    title="Professional Interest"
                    icon="heart"
                    sectionId="interest"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.interest)}
                    isEmpty={sectionEmpty.interest}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.interest.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.interest.description}
                    completionHint="Listing interests helps match you with fitting roles."
                  >
                    <div className="space-y-3">
                      {editingSections.interest && (
                        <div className="flex justify-end">
                          <SectionInlineEditButton
                            label="professional interests"
                            onClick={() => handleOpenEditDialog("interest")}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {profile.professionalInterests.map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 5. Skills */}
                <div ref={(el) => { sectionRefs.current.skills = el; }} id="skills-section">
                  <ProfileSectionCard
                    title="Skills"
                    icon="listChecks"
                    sectionId="skills"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.skills)}
                    isEmpty={sectionEmpty.skills}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.skills.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.skills.description}
                    completionHint="Showcase your skills to stand out in job searches."
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold">Technical</h4>
                          {editingSections.skills && (
                            <SectionInlineEditButton
                              label="technical skills"
                              onClick={() => handleOpenEditDialog("skills", { editSkillType: "technical" })}
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.technical.map((skill) => (
                            <Badge key={skill} variant="secondary" className="rounded-full">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold">Others</h4>
                          {editingSections.skills && (
                            <SectionInlineEditButton
                              label="other skills"
                              onClick={() => handleOpenEditDialog("skills", { editSkillType: "other" })}
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.others.map((skill) => (
                            <Badge key={skill} variant="secondary" className="rounded-full">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold">Language Proficiency</h4>
                          {editingSections.skills && (
                            <SectionInlineEditButton
                              label="language proficiency"
                              onClick={() => handleOpenEditDialog("skills", { editSkillType: "language" })}
                            />
                          )}
                        </div>
                        <div className="space-y-4">
                          {profile.skills.languages.map((lang, i) => (
                            <div key={i} className="space-y-2">
                              <p className="text-sm font-medium">{lang.language}</p>
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <span>Speaking: {lang.speaking}</span>
                                <span>Reading: {lang.reading}</span>
                                <span>Writing: {lang.writing}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 6. Education */}
                <div ref={(el) => { sectionRefs.current.education = el; }} id="education-section">
                  <ProfileSectionCard
                    title="Education"
                    icon="bookOpen"
                    sectionId="education"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.education)}
                    isEmpty={sectionEmpty.education}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.education.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.education.description}
                    completionHint="Education details validate your qualifications to employers."
                  >
                    <div className="space-y-4">
                      {profile.education.map((edu, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FontAwesomeIcon name="bookOpen" className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{edu.school}</p>
                            <p className="text-sm text-muted-foreground">{edu.degree}</p>
                            <p className="text-xs text-muted-foreground">{edu.years}</p>
                          </div>
                          {editingSections.education && (
                            <SectionInlineEditButton
                              label={`${edu.school} education`}
                              onClick={() => handleOpenEditDialog("education", { editItemIndex: i })}
                            />
                          )}
                          {edu.abbreviation && (
                            <Badge variant="secondary" className="shrink-0 rounded-full text-xs">{edu.abbreviation}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 7. Clinical Experience */}
                <div ref={(el) => { sectionRefs.current.clinical = el; }} id="clinical-section">
                  <ProfileSectionCard
                    title="Clinical Experience"
                    icon="stethoscope"
                    sectionId="clinical"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.clinical)}
                    isEmpty={sectionEmpty.clinical}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.clinical.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.clinical.description}
                    completionHint="Clinical experience is the most sought detail by employers."
                  >
                    <div className="space-y-4">
                      {profile.clinicalExperience.map((exp, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FontAwesomeIcon name="stethoscope" className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.organization}</p>
                            <p className="text-sm text-muted-foreground">{exp.location}</p>
                            <p className="text-xs text-muted-foreground">{exp.years}</p>
                            <p className="text-sm text-foreground mt-2">{exp.description}</p>
                          </div>
                          {editingSections.clinical && (
                            <SectionInlineEditButton
                              label={`${exp.title} clinical experience`}
                              onClick={() => handleOpenEditDialog("clinical", { editItemIndex: i })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 8. Work Experience */}
                <div ref={(el) => { sectionRefs.current.work = el; }} id="work-section">
                  <ProfileSectionCard
                    title="Work Experience"
                    icon="briefcase"
                    sectionId="work"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.work)}
                    isEmpty={sectionEmpty.work}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.work.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.work.description}
                    completionHint="Work experience shows your readiness for the role."
                  >
                    <div className="space-y-4">
                      {profile.workExperience.map((exp, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FontAwesomeIcon name="briefcase" className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.organization}</p>
                            <p className="text-sm text-muted-foreground">{exp.location}</p>
                            <p className="text-xs text-muted-foreground">{exp.years}</p>
                            <p className="text-sm text-foreground mt-2">{exp.description}</p>
                          </div>
                          {editingSections.work && (
                            <SectionInlineEditButton
                              label={`${exp.title} work experience`}
                              onClick={() => handleOpenEditDialog("work", { editItemIndex: i })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 9. Memberships */}
                <div ref={(el) => { sectionRefs.current.memberships = el; }} id="memberships-section">
                  <ProfileSectionCard
                    title="Memberships"
                    icon="id-badge"
                    sectionId="memberships"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.memberships)}
                    isEmpty={sectionEmpty.memberships}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.memberships.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.memberships.description}
                    completionHint="Professional memberships boost your credibility."
                  >
                    <div className="space-y-4">
                      {profile.memberships.map((m, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FontAwesomeIcon name="id-badge" className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{m.name}</p>
                            <p className="text-sm text-muted-foreground">Membership Number: {m.membershipNumber}</p>
                            <p className="text-xs text-muted-foreground">{m.validFrom} - {m.validTo}</p>
                            <p className="text-xs text-muted-foreground">{m.category}</p>
                          </div>
                          {editingSections.memberships && (
                            <SectionInlineEditButton
                              label={`${m.name} membership`}
                              onClick={() => handleOpenEditDialog("memberships", { editItemIndex: i })}
                            />
                          )}
                          <Badge variant="secondary" className="shrink-0 rounded-full text-xs">{m.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 10. Licensures */}
                <div ref={(el) => { sectionRefs.current.licensures = el; }} id="licensures-section">
                  <ProfileSectionCard
                    title="Licensures"
                    icon="idCardClip"
                    sectionId="licensures"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.licensures)}
                    isEmpty={sectionEmpty.licensures}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.licensures.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.licensures.description}
                    completionHint="Valid licensures are required for most placements."
                  >
                    <div className="space-y-4">
                      {profile.licensures.map((l, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FontAwesomeIcon name="idCardClip" className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{l.name}</p>
                            <p className="text-sm text-muted-foreground">{l.number}</p>
                            <p className="text-xs text-muted-foreground">{l.validFrom} - {l.validTo}</p>
                          </div>
                          {editingSections.licensures && (
                            <SectionInlineEditButton
                              label={`${l.name} licensure`}
                              onClick={() => handleOpenEditDialog("licensures", { editItemIndex: i })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 11. Accomplishments */}
                <div ref={(el) => { sectionRefs.current.accomplishments = el; }} id="accomplishments-section">
                  <ProfileSectionCard
                    title="Accomplishments"
                    icon="award"
                    sectionId="accomplishments"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.accomplishments)}
                    isEmpty={sectionEmpty.accomplishments}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.accomplishments.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.accomplishments.description}
                    completionHint="Accomplishments set you apart from other candidates."
                  >
                    <div className="space-y-6">
                      {profile.accomplishments.publications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Publications</h4>
                          <div className="space-y-4">
                            {profile.accomplishments.publications.map((p, i) => (
                              <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <FontAwesomeIcon name="fileText" className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{p.title}</p>
                                  <p className="text-sm text-muted-foreground">{p.journal}</p>
                                  <p className="text-xs text-muted-foreground">{p.authors}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.accomplishments.awards.length > 0 && (
                        <div>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold">Awards</h4>
                            {editingSections.accomplishments && (
                              <SectionInlineEditButton
                                label="awards"
                                onClick={() => handleOpenEditDialog("accomplishments")}
                              />
                            )}
                          </div>
                          <div className="space-y-4">
                            {profile.accomplishments.awards.map((a, i) => (
                              <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <FontAwesomeIcon name="award" className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{a.title}</p>
                                  <p className="text-sm text-muted-foreground">{a.organization}</p>
                                  <p className="text-xs text-muted-foreground">{a.year}</p>
                                </div>
                                {editingSections.accomplishments && (
                                  <SectionInlineEditButton
                                    label={`${a.title} award`}
                                    onClick={() => handleOpenEditDialog("accomplishments", { editItemIndex: i })}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 12. Veteran Status */}
                <div ref={(el) => { sectionRefs.current.veteran = el; }} id="veteran-section">
                  <ProfileSectionCard
                    title="Veteran Status"
                    icon="flagCheckered"
                    sectionId="veteran"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.veteran)}
                    isEmpty={sectionEmpty.veteran}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.veteran.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.veteran.description}
                    completionHint="Veteran status may qualify you for additional opportunities."
                  >
                    <div className="space-y-3">
                      {editingSections.veteran && (
                        <div className="flex justify-end">
                          <SectionInlineEditButton
                            label="veteran status"
                            onClick={() => handleOpenEditDialog("veteran")}
                          />
                        </div>
                      )}
                      <p className="text-sm text-foreground">
                        {profile.veteranStatus.isVeteran
                          ? (profile.veteranStatus.details ?? "Yes")
                          : "No"}
                      </p>
                    </div>
                  </ProfileSectionCard>
                </div>

                {/* 13. Resume */}
                <div ref={(el) => { sectionRefs.current.resume = el; }} id="resume-section">
                  <ProfileSectionCard
                    title="Resume"
                    icon="fileText"
                    sectionId="resume"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.resume)}
                    isEmpty={sectionEmpty.resume}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.resume.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.resume.description}
                    completionHint="An updated resume helps employers learn about you quickly."
                  >
                    {profile.resume ? (
                      <div className="flex items-center gap-4 p-4 rounded-lg">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FontAwesomeIcon name="fileText" className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{profile.resume.fileName}</p>
                          <p className="text-xs text-muted-foreground">{profile.resume.size} · Uploaded {profile.resume.uploadedDate}</p>
                        </div>
                        {editingSections.resume && (
                          <SectionInlineEditButton
                            label="resume"
                            onClick={() => handleOpenEditDialog("resume")}
                          />
                        )}
                        <Button variant="outline" size="sm" aria-label="Download resume">
                          <FontAwesomeIcon name="download" className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No resume uploaded.</p>
                    )}
                  </ProfileSectionCard>
                </div>

                {/* 14. Job Preferences */}
                <div ref={(el) => { sectionRefs.current.jobPreferences = el; }} id="jobPreferences-section">
                  <ProfileSectionCard
                    title="Job Preferences"
                    icon="briefcase"
                    sectionId="jobPreferences"
                    onAddDetails={handleAddDetails}
                    onEditMode={handleEditMode}
                    onDoneEditing={handleDoneEditing}
                    isEditMode={Boolean(editingSections.jobPreferences)}
                    isEmpty={sectionEmpty.jobPreferences}
                    emptyStateMessage={SECTION_EMPTY_MESSAGES.jobPreferences.message}
                    emptyStateDescription={SECTION_EMPTY_MESSAGES.jobPreferences.description}
                    completionHint="Updated and complete info gets matched to 20x more relevant job opportunities."
                  >
                    {profile.jobPreferences ? (
                      <div className="space-y-4">
                        {editingSections.jobPreferences && (
                          <div className="flex justify-end">
                            <SectionInlineEditButton
                              label="job preferences"
                              onClick={() => handleOpenEditDialog("jobPreferences")}
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Desired Role</h4>
                          <p className="text-sm text-foreground">{profile.jobPreferences.desiredRole}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Preferred Location</h4>
                          <p className="text-sm text-foreground">{profile.jobPreferences.preferredLocation}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Patient / Care Areas</h4>
                          <p className="text-sm text-foreground">{profile.jobPreferences.patientCareAreas}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Work Priorities</h4>
                          <p className="text-sm text-foreground">{profile.jobPreferences.workPriorities}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No job preferences specified.</p>
                    )}
                  </ProfileSectionCard>
                </div>
              </div>
            </div>

            {/* Right column: Profile Completion card - task list UI (hidden on mobile, visible on desktop) */}
            {!isMobile && (
            <div className="flex w-96 shrink-0 flex-col overflow-y-auto min-h-0">
              <Card className="mt-0 mb-6 rounded-xl border border-border p-6 shrink-0 w-full gap-3">
                {(() => {
                  const profileCompletionItems = PROFILE_COMPLETION_CONFIG.map((item) => ({
                    ...item,
                    completed: !sectionEmpty[item.id as keyof typeof sectionEmpty],
                  }));
                  const completedCount = profileCompletionItems.filter((i) => i.completed).length;
                  const progressPct = Math.round((completedCount / profileCompletionItems.length) * 100);
                  const progressVariant: ProgressVariant =
                    progressPct >= 67 ? "success" : progressPct >= 34 ? "warning" : "destructive";
                  const completionChip =
                    progressPct >= 100 ? "Complete" :
                    progressPct >= 67 ? "Almost There" :
                    progressPct >= 50 ? "Halfway" :
                    progressPct >= 34 ? "Getting Started" : "Minimal";
                  return (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FontAwesomeIcon name="faceSmile" className="h-5 w-5 text-foreground shrink-0" weight="regular" />
                          <h3 className="text-base font-semibold truncate">Profile Completion</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs font-normal rounded-full shrink-0">
                          {completionChip}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Progress value={progressPct} variant={progressVariant} className="h-2 flex-1 min-w-0" />
                        <span className="text-xs text-muted-foreground shrink-0">{progressPct}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-0">
                        <FontAwesomeIcon name="sparkles" className="h-4 w-4 text-primary shrink-0" weight="solid" />
                        <p className="text-sm text-muted-foreground">
                          You are missing out 3490 job openings.
                        </p>
                      </div>
                    </>
                  );
                })()}
                <div className="flex flex-col divide-y divide-border border border-border overflow-hidden rounded-xl">
                  {PROFILE_COMPLETION_CONFIG.map((item) => {
                    const completed = !sectionEmpty[item.id as keyof typeof sectionEmpty];
                    return (
                      <TaskItem
                        key={item.id}
                        label={item.label}
                        completed={completed}
                        onClick={() => scrollToSection(item.id)}
                      />
                    );
                  })}
                </div>
              </Card>
            </div>
            )}
          </div>

          {/* Onboarding footer: Save and Continue */}
          {isOnboarding && (
            <div className="flex-none shrink-0 border-t border-border bg-background px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground min-h-11 min-w-11 md:min-h-0 md:min-w-0"
                onClick={() => onOpenChange(false)}
                aria-label="Skip profile setup for now"
              >
                Skip for now
              </Button>
              <Button
                className="min-w-[180px] min-h-11 md:min-h-0"
                onClick={() => {
                  onSaveAndContinue?.();
                  onOpenChange(false);
                }}
              >
                Save and Continue
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
      {dialogState && (
        <ProfileCardDialog
          open={dialogState.open}
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          sectionId={dialogState.sectionId}
          mode={dialogState.mode}
          editAddressType={dialogState.editAddressType}
          editItemIndex={dialogState.editItemIndex}
          editSkillType={dialogState.editSkillType}
          onSave={(data, options) => {
            markSectionAsCompleted(dialogState.sectionId, data);
            if (!options?.keepOpen) {
              setDialogState(null);
            }
          }}
        />
      )}
    </Sheet>
  );
}

/** Onboarding variant — Save and Continue footer, hides Download PDF. */
export function ProfileSettingsModalOnboarding(
  props: Omit<ProfileSettingsModalProps, "variant"> & { onSaveAndContinue: () => void }
) {
  return (
    <ProfileSettingsModal
      {...props}
      variant="onboarding"
      onSaveAndContinue={props.onSaveAndContinue}
    />
  );
}
