import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GettingStartedScreen from './GettingStartedScreen';
import Step1TellUs from './onboarding/Step1TellUs';
import Step2BuildProfile from './onboarding/Step2BuildProfile';
import Step3Review from './onboarding/Step3Review';
import CelebrationTransition from './onboarding/CelebrationTransition';
import DataSyncScreen from './onboarding/DataSyncScreen';
import PrismProfileExtract from './PrismProfileExtract';
import LoadingScreen from './LoadingScreen';

export interface OnboardingData {
  roles: string[];
  location: string;
  skills: string[];
  jobAlertsEnabled: boolean;
  profileSource: 'prism' | 'upload' | 'later' | null;
  prismAccount?: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkipToHomepage?: () => void;
  userName?: string;
  product?: 'prism' | 'one';
}

export default function OnboardingFlow({ onComplete, onSkipToHomepage, userName, product = 'one' }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<'getting_started' | 'loading' | 'prism_extract' | 1 | 2 | 3 | 'celebration' | 'data_sync'>('getting_started');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    roles: [],
    location: '',
    skills: [],
    jobAlertsEnabled: true,
    profileSource: null,
  });

  // Auto-transition from loading to data_sync after 3 seconds
  useEffect(() => {
    if (currentStep === 'loading') {
      const timer = setTimeout(() => {
        setCurrentStep('data_sync');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleGettingStarted = () => {
    // User chose to complete profile with Prism - show loading then data sync
    setCurrentStep('loading');
  };

  const handleSkipToHomepage = () => {
    // User chose to skip and go directly to homepage
    if (onSkipToHomepage) {
      onSkipToHomepage();
    }
  };

  const handlePrismExtractComplete = () => {
    // After Prism data extraction, show celebration then complete
    setCurrentStep('celebration');
  };

  const handleStep1Complete = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Complete = () => {
    setCurrentStep('celebration');
  };

  const handleCelebrationComplete = () => {
    setCurrentStep('data_sync');
  };

  const handleDataSyncComplete = () => {
    onComplete();
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentStep === 'getting_started' && (
          <motion.div
            key="getting_started"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <GettingStartedScreen
              onGetStarted={handleGettingStarted}
              onSkipToHomepage={handleSkipToHomepage}
              product={product}
              userName={userName}
            />
          </motion.div>
        )}

        {currentStep === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <LoadingScreen userName={userName} />
          </motion.div>
        )}

        {currentStep === 'prism_extract' && (
          <motion.div
            key="prism_extract"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <PrismProfileExtract
              onComplete={handlePrismExtractComplete}
              userName={userName}
            />
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Step1TellUs
              onNext={handleStep1Complete}
              initialData={onboardingData}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Step2BuildProfile
              onNext={handleStep2Complete}
              onBack={handleBack}
              initialData={onboardingData}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Step3Review
              onNext={handleStep3Complete}
              onBack={handleBack}
              data={onboardingData}
              userName={userName}
            />
          </motion.div>
        )}

        {currentStep === 'celebration' && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <CelebrationTransition
              onComplete={handleCelebrationComplete}
              userName={userName}
            />
          </motion.div>
        )}

        {currentStep === 'data_sync' && (
          <motion.div
            key="data_sync"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <DataSyncScreen
              onComplete={handleDataSyncComplete}
              userName={userName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}