import * as React from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/stores/app-store";
import { WelcomePageTemplate } from "@/components/shared/welcome-page-template";
import { BuildProfileFlow, type ProfileBuildOption } from "@/components/features/build-profile-flow";
import welcomeImage from "@/assets/Exxat_welcome.png";

const WELCOME_IMAGE_FALLBACK = "/Illustration/Exxat_welcome.png";

type WelcomeStep = "welcome" | "build-profile";

/** Welcome page shown before Home — prompts user to set up profile or skip */
export function WelcomePage() {
  const [step, setStep] = React.useState<WelcomeStep>("welcome");
  const [showDoLaterConfirm, setShowDoLaterConfirm] = React.useState(false);
  const setHasSeenWelcome = useAppStore((s) => s.setHasSeenWelcome);
  const setProfileSettingsOpen = useAppStore((s) => s.setProfileSettingsOpen);
  const navigateToPage = useAppStore((s) => s.navigateToPage);

  const handleBuildProfileClick = () => {
    setStep("build-profile");
  };

  const handleDoLaterClick = () => {
    setShowDoLaterConfirm(true);
  };

  const handleConfirmDoLater = () => {
    setShowDoLaterConfirm(false);
    setHasSeenWelcome(true);
    navigateToPage("Home");
  };

  const handleProfileOptionSelect = (option: ProfileBuildOption) => {
    setHasSeenWelcome(true);
    setProfileSettingsOpen(true);
    navigateToPage("Home");
    // TODO: When option === "prism", show Prism sync flow; when "resume", show upload flow
  };

  if (step === "build-profile") {
    return (
      <>
        <BuildProfileFlow
          onSelect={handleProfileOptionSelect}
          onDoLater={handleDoLaterClick}
          onManualComplete={handleConfirmDoLater}
        />
        <AlertDialog open={showDoLaterConfirm} onOpenChange={setShowDoLaterConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Skip profile setup?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <FontAwesomeIcon name="alertCircle" className="h-4 w-4 shrink-0" weight="solid" />
                    <span>You&apos;ll miss out on personalized recommendations.</span>
                  </div>
                  <p>
                    A complete profile helps us match you with the right clinical opportunities, jobs, and placements tailored to your experience and goals.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go back</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDoLater}>
                Skip anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <WelcomePageTemplate
      title="Welcome to Exxat One"
      description="Let's set up your profile so we can help you discover the perfect clinical opportunities tailored just for you."
      background="sidebar"
      headerVariant="hero"
      illustration={
        <img
          src={welcomeImage || WELCOME_IMAGE_FALLBACK}
          alt=""
          width={400}
          height={392}
          className="max-w-full max-h-[320px] md:max-h-[420px] w-auto h-auto object-contain object-right md:mr-0"
          loading="eager"
          aria-hidden
        />
      }
    >
      <Button
        onClick={handleBuildProfileClick}
        className="h-10 px-4 gap-2 rounded-md font-medium"
        aria-label="Build my profile"
      >
        Build my Profile
        <FontAwesomeIcon name="arrowRight" className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        onClick={handleDoLaterClick}
        className="h-10 rounded-md border border-transparent px-4 text-base font-semibold text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label="I'll do it later"
      >
        I&apos;ll do it later
      </Button>
      <AlertDialog open={showDoLaterConfirm} onOpenChange={setShowDoLaterConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip profile setup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <FontAwesomeIcon name="alertCircle" className="h-4 w-4 shrink-0" weight="solid" />
                  <span>You&apos;ll miss out on personalized recommendations.</span>
                </div>
                <p>
                  A complete profile helps us match you with the right clinical opportunities, jobs, and placements tailored to your experience and goals.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDoLater}>
              Skip anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WelcomePageTemplate>
  );
}
