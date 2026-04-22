"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { BuildProfilePageTemplate } from "@/components/shared/build-profile-page-template";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/ui/utils";
import { sidebarData } from "@/components/layout/sidebar-data";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { ProfileSettingsModalOnboarding } from "@/components/features/profile-settings-modal";

export type ProfileBuildOption = "manual" | "prism" | "resume";

export interface BuildProfileFlowProps {
  onSelect: (option: ProfileBuildOption) => void;
  onDoLater: () => void;
  /** Called when user completes manual profile (Save and Continue). Defaults to onDoLater. */
  onManualComplete?: () => void;
}

const PRISM_IMPORT_ITEMS = [
  { icon: "user" as const, label: "Personal Information", desc: "Name, pronouns, profile photo" },
  { icon: "mail" as const, label: "Contact Details", desc: "Email address, phone number" },
  { icon: "mapPin" as const, label: "Address Information", desc: "Current address, permanent address" },
  { icon: "bookOpen" as const, label: "Education History", desc: "Schools, degrees, graduation dates, GPA" },
  { icon: "building2" as const, label: "Clinical Experience", desc: "Hospital affiliations, clinical rotations, hours" },
  { icon: "stethoscope" as const, label: "Professional Summary", desc: "Skills, certifications, career preferences" },
];

type OpenCard = "prism" | "resume" | null;

/** Build profile flow — two collapsible cards (Prism, Resume) + bottom links. Only one card open at a time. */
export function BuildProfileFlow({ onSelect, onDoLater, onManualComplete }: BuildProfileFlowProps) {
  const [openCard, setOpenCard] = React.useState<OpenCard>("prism");
  const [showManualProfileModal, setShowManualProfileModal] = React.useState(false);
  const [prismConsent, setPrismConsent] = React.useState(true);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importComplete, setImportComplete] = React.useState(false);
  const [importAttemptCount, setImportAttemptCount] = React.useState(0);
  const [importError, setImportError] = React.useState<string | null>(null);

  const prismOpen = openCard === "prism";
  const resumeOpen = openCard === "resume";

  const handlePrismOpenChange = (open: boolean) => {
    if (isImporting) return; // Keep card open during import
    setOpenCard(open ? "prism" : null);
  };

  const handleResumeOpenChange = (open: boolean) => {
    if (isImporting) return;
    setOpenCard(open ? "resume" : null);
  };

  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  const handleContinueWithPrism = () => {
    if (prismConsent) {
      setImportAttemptCount((current) => current + 1);
      setImportError(null);
      setIsImporting(true);
      setImportProgress(0);
    }
  };

  // Simulate import progress when importing (slowed down: 8 seconds)
  React.useEffect(() => {
    if (!isImporting) return;
    const duration = 8000;
    const start = Date.now();
    const currentAttempt = importAttemptCount;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setImportProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setIsImporting(false);
        if (currentAttempt === 1) {
          setImportError("We couldn't finish importing your Prism profile. Please try again.");
          setImportProgress(0);
          return;
        }
        setImportComplete(true);
      }
    }, 80);
    return () => clearInterval(id);
  }, [importAttemptCount, isImporting]);

  // Success page after import completes — Figma frame 140:3700
  if (importComplete) {
    const profile = useProfileStore.getState().profile;
    const edu = profile.education[0];
    const degreeLabel = edu ? (edu.abbreviation ? `${edu.degree} (${edu.abbreviation})` : edu.degree) : "—";
    const schoolName = edu?.school ?? "—";
    const profileProgress = 75;

    return (
      <BuildProfilePageTemplate
        title=""
        contentMaxWidth={480}
        className="!bg-background !text-foreground"
      >
        <div className="flex flex-col gap-6 w-full">
          {/* Success banner */}
          <div className="rounded-t-2xl bg-chart-2/15 px-4 py-0 flex items-center gap-4">
            <FontAwesomeIcon name="circleCheck" className="h-9 w-9 shrink-0 text-chart-2" weight="solid" aria-hidden />
            <p className="page-title-sm text-chart-2 font-semibold">Profile imported successfully</p>
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden -mt-14 pt-12">
            <div className="px-6 pb-6 pt-4">
              <div className="flex items-start gap-6 mb-4">
                <Avatar className="h-16 w-16 shrink-0 rounded-full border-2 border-foreground">
                  <AvatarImage src={sidebarData.user.avatar} alt={sidebarData.user.name} />
                  <AvatarFallback className="text-lg font-semibold">
                    {sidebarData.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground">{sidebarData.user.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {profile.personal.pronouns || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon name="bookOpen" className="h-4 w-4 shrink-0" weight="regular" aria-hidden />
                      <span>{degreeLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon name="building" className="h-4 w-4 shrink-0" weight="regular" aria-hidden />
                      <span>{schoolName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile progress */}
              <div className="flex items-center gap-3 mb-4">
                <Progress value={profileProgress} variant="auto" className="h-2 flex-1" />
                <span className="text-xs font-medium tabular-nums shrink-0">{profileProgress}% completed</span>
              </div>

              {/* Imported items list — compact */}
              <div className="rounded-lg border border-border bg-background divide-y divide-border">
                {PRISM_IMPORT_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2">
                    <FontAwesomeIcon name={item.icon} className="h-5 w-5 shrink-0 text-muted-foreground" weight="regular" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{item.desc}</p>
                    </div>
                    <FontAwesomeIcon name="circleCheck" className="h-5 w-5 shrink-0 text-chart-2" weight="solid" aria-hidden />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 items-center mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  You can review and edit from your profile anytime
                </p>
                <Button
                  className="w-full h-10 gap-2"
                  onClick={() => {
                    useAppStore.getState().setJustTransitionedFromWelcome(true);
                    useAppStore.getState().setHasSeenWelcome(true);
                    useAppStore.getState().setProfileSettingsOpen(true);
                    useAppStore.getState().navigateToPage("Home");
                  }}
                  aria-label="Continue with review"
                >
                  Continue with Review
                  <FontAwesomeIcon name="arrowRight" className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </BuildProfilePageTemplate>
    );
  }

  return (
    <BuildProfilePageTemplate
      title="Choose how to build your profile"
      contentMaxWidth={520}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Card 1: Prism */}
        <Collapsible open={prismOpen} onOpenChange={handlePrismOpenChange}>
          <div
            className={cn(
              "rounded-2xl border-2 p-4 transition-colors bg-card",
              prismOpen
                ? "border-primary"
                : "border-sidebar-border hover:border-sidebar-foreground/30"
            )}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
                aria-expanded={prismOpen}
                aria-busy={isImporting}
              >
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-sidebar-foreground">
                      Import from Prism
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-xs font-normal border-chip-2 text-chip-2"
                    >
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-sidebar-foreground/80 leading-5">
                    Import the profile details you already keep updated in Prism.
                  </p>
                </div>
                <FontAwesomeIcon
                  name="chevronDown"
                  className={cn(
                    "h-6 w-6 shrink-0 text-sidebar-foreground transition-transform",
                    prismOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="flex flex-col gap-6 pt-4">
                {isImporting ? (
                  /* Importing card — Figma frame 139:3145 */
                  <div className="rounded-lg border border-border overflow-hidden bg-card">
                    <div className="p-4 flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          Importing from Prism
                        </p>
                        <p className="text-sm text-muted-foreground leading-5">
                          We are securely importing your profile data
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {PRISM_IMPORT_ITEMS.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                            >
                              <FontAwesomeIcon
                                name={item.icon}
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                weight="regular"
                                aria-hidden
                              />
                              <span className="text-xs font-medium text-foreground">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border px-4 py-3 bg-background">
                      <div className="flex flex-col gap-0.5">
                        <Progress
                          value={importProgress}
                          variant="auto"
                          className="h-2"
                          aria-label="Import progress"
                        />
                        <p className="text-xs font-medium text-foreground">
                          Completed {importProgress}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {importError ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <div className="flex items-start gap-3">
                          <FontAwesomeIcon
                            name="triangleExclamation"
                            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              Prism import failed
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {importError}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Import from Prism section */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="p-4 space-y-4 text-left">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">
                            We&apos;ll import these details
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PRISM_IMPORT_ITEMS.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                            >
                              <FontAwesomeIcon
                                name={item.icon}
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                weight="regular"
                                aria-hidden
                              />
                              <span className="text-xs font-medium text-foreground">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Consent */}
                      <div className="border-t border-border p-4">
                        <div className="flex gap-3 items-start">
                          <Checkbox
                            id="prism-consent"
                            checked={prismConsent}
                            onCheckedChange={(v: boolean | "indeterminate") => setPrismConsent(!!v)}
                            className="mt-0.5 shrink-0"
                            aria-describedby="prism-consent-desc"
                          />
                          <div id="prism-consent-desc" className="space-y-1 min-w-0">
                            <label
                              htmlFor="prism-consent"
                              className="text-sm font-medium text-foreground cursor-pointer"
                            >
                              Use my Prism info to speed up account setup.
                            </label>
                            <p className="text-xs text-muted-foreground">
                              By continuing, you agree to our{" "}
                              <a href="#" className="underline hover:text-foreground">
                                T&amp;C
                              </a>{" "}
                              and{" "}
                              <a href="#" className="underline hover:text-foreground">
                                Privacy Policy
                              </a>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleContinueWithPrism}
                      disabled={!prismConsent}
                      className="w-full h-10 gap-2"
                      aria-label={importError ? "Retry Prism import" : "Continue with Prism"}
                    >
                      {importError ? "Retry Prism Import" : "Continue with Prism"}
                      <FontAwesomeIcon name="arrowRight" className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Card 2: Resume */}
        <Collapsible open={isImporting ? false : resumeOpen} onOpenChange={handleResumeOpenChange}>
          <div
            className={cn(
              "rounded-2xl border p-4 transition-colors bg-card",
              "border-sidebar-border hover:border-sidebar-foreground/30",
              isImporting && "opacity-60 pointer-events-none"
            )}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
                aria-expanded={resumeOpen}
              >
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      name="fileText"
                      className="h-5 w-5 text-sidebar-foreground shrink-0"
                      weight="regular"
                    />
                    <span className="text-base font-semibold text-sidebar-foreground">
                      Import from Resume
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-sidebar-foreground/80 leading-5">
                      Upload your resume or LinkedIn PDF and we&apos;ll pull in the basics
                    </p>
                    <FontAwesomeIcon
                      name="circleInfo"
                      className="h-4 w-4 shrink-0 text-sidebar-foreground/60"
                      weight="regular"
                    />
                  </div>
                </div>
                <FontAwesomeIcon
                  name="chevronDown"
                  className={cn(
                    "h-6 w-6 shrink-0 text-sidebar-foreground transition-transform",
                    resumeOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="flex flex-col gap-6 pt-4">
                {/* Upload / drag & drop area */}
                <div className="rounded-lg border border-border bg-card border-dashed flex flex-col items-center justify-center gap-4 p-6 min-h-[180px]">
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon
                      name="plus"
                      className="h-14 w-14 text-muted-foreground"
                      weight="regular"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Upload or drag & drop your resume
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC or DOCX • Max 2 MB
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full h-10 gap-2"
                  disabled
                  aria-label="Extract resume info"
                >
                  Extract Resume Info
                  <FontAwesomeIcon name="arrowRight" className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Bottom links — 50/50 with separator */}
        <div
          className={cn(
            "flex flex-row items-stretch pt-4 border-t border-sidebar-border",
            isImporting && "opacity-60 pointer-events-none"
          )}
        >
          <div className="flex flex-1 min-w-0 flex-col gap-1 pr-4">
            <Button
              variant="link"
              className="h-auto p-0 text-base font-medium text-sidebar-foreground hover:text-primary hover:bg-transparent justify-start underline-offset-4 min-h-11 min-w-11 md:min-h-0 md:min-w-0"
              onClick={() => setShowManualProfileModal(true)}
              disabled={isImporting}
              aria-label="Add details manually"
            >
              Add details manually
              <FontAwesomeIcon name="arrowRight" className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
              <FontAwesomeIcon name="gear" className="h-4 w-4 shrink-0" weight="regular" />
              <span>Start with a blank profile on the next screen</span>
            </div>
          </div>

          <div
            className="w-px shrink-0 self-stretch bg-sidebar-border"
            aria-hidden
          />

          <div className="flex flex-1 min-w-0 flex-col gap-1 pl-8">
            <Button
              variant="link"
              className="h-auto justify-start p-0 text-base font-medium text-sidebar-foreground min-h-11 min-w-11 md:min-h-0 md:min-w-0 hover:bg-transparent hover:text-primary underline-offset-4"
              onClick={onDoLater}
              disabled={isImporting}
              aria-label="I'll do it later"
            >
              I&apos;ll do it later
              <FontAwesomeIcon name="arrowRight" className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
              <FontAwesomeIcon name="faceSmile" className="h-4 w-4 shrink-0" weight="regular" />
              <span>You could totally miss 3,490 job recommendations</span>
            </div>
          </div>
        </div>
      </div>

      <ProfileSettingsModalOnboarding
        open={showManualProfileModal}
        onOpenChange={setShowManualProfileModal}
        user={{
          name: sidebarData.user.name,
          email: sidebarData.user.email,
          avatar: sidebarData.user.avatar,
          discipline: useProfileStore.getState().profile.education[0]?.degree ?? undefined,
          graduationYear: useProfileStore.getState().profile.education[0]?.years?.split(" - ")[1] ?? undefined,
        }}
        forceAllEmpty
        onSaveAndContinue={() => {
          setShowManualProfileModal(false);
          (onManualComplete ?? onDoLater)();
        }}
      />
    </BuildProfilePageTemplate>
  );
}
