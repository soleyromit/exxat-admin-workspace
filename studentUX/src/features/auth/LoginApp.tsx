import React, { useState } from "react";
import { motion } from "motion/react";
import { MarketingCarousel } from "./components/MarketingCarousel";
import { SignInSide } from "./components/SignInSide";
import { Dashboard } from "./components/Dashboard";
import OnboardingFlow from "./components/OnboardingFlow";
import ExxatOneHomepage from "./components/ExxatOneHomepage";
import SimpleHomepage from "./components/SimpleHomepage";

export default function App() {
  const [step, setStep] = useState<'email' | 'password' | 'two_factor_auth' | 'signup' | 'role_selection' | 'forgot_password' | 'account_created' | 'onboarding' | 'welcome' | 'dashboard' | 'sso_redirect' | 'product_selection' | 'exxat_one_homepage' | 'simple_homepage'>('email');
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<'prism' | 'one' | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isStudentOnboarding, setIsStudentOnboarding] = useState(false);

  // Device trust check utility
  const checkDeviceTrust = (userEmail: string): boolean => {
    try {
      const DEVICE_TRUST_KEY = 'exxat_trusted_devices';
      const trustedDevicesStr = localStorage.getItem(DEVICE_TRUST_KEY);
      if (!trustedDevicesStr) return false;

      const trustedDevices = JSON.parse(trustedDevicesStr);
      
      // Generate device fingerprint
      const generateFingerprint = () => {
        const navigator = window.navigator;
        const screen = window.screen;
        const components = [
          navigator.userAgent,
          navigator.language,
          screen.colorDepth,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset(),
        ];
        const fingerprint = components.join('|');
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
      };
      
      const deviceFingerprint = generateFingerprint();
      const deviceKey = `${userEmail}_${deviceFingerprint}`;
      
      const deviceData = trustedDevices[deviceKey];
      if (!deviceData) return false;

      // Check if trust has expired
      const expiryDate = new Date(deviceData.expiresAt);
      const now = new Date();
      
      return now <= expiryDate;
    } catch (error) {
      return false;
    }
  };

  const handleNext = (nextStep?: 'password' | 'signup' | 'product_selection') => {
    // The email recognition logic in SignInSide.tsx handles routing
    // For password auth (@exxat.com), proceed to password step or product selection
    // For signup flow, proceed to signup step
    if (nextStep === 'signup') {
      setStep('signup');
    } else if (nextStep === 'product_selection') {
      setStep('product_selection');
    } else {
      setStep('password');
    }
  };

  const handleBack = () => {
    if (step === 'forgot_password') {
      setStep('password');
    } else if (step === 'account_created') {
      setStep('signup');
    } else if (step === 'two_factor_auth') {
      setStep('password');
    } else if (step === 'password') {
      // Check if user came from product_selection
      const lowerEmail = email.toLowerCase().trim();
      if (lowerEmail.endsWith('@exxat.com') && 
          lowerEmail !== 'prism@exxat.com' && 
          lowerEmail !== 'exxatone@exxat.com') {
        // Multi-product user - go back to product selection
        setStep('product_selection');
      } else {
        // Single product user or other - go back to email
        setStep('email');
      }
    } else if (step === 'product_selection') {
      // Go back to email
      setStep('email');
      // Clear selected product
      setSelectedProduct(null);
    } else {
      setStep('email');
    }
  };

  const handleRestart = () => {
    // Restart flow from email step and clear all state
    setEmail("");
    setUserName("");
    setSelectedProduct(null);
    setStep('email');
  };

  const handleSignIn = () => {
    // Implement sign in logic here
    console.log("Sign in with", email);
    if (step === 'role_selection') {
       // In a real app, this would proceed to password or dashboard
       setStep('password');
    } else if (step === 'product_selection') {
       // After product selection in the new flow, go to password
       setStep('password');
    } else if (step === 'password') {
       // After password, always proceed to 2FA
       // Users can opt to "Remember this device for 30 days" during 2FA
       console.log('Password verified - proceeding to 2FA');
       setStep('two_factor_auth');
    } else if (step === 'two_factor_auth') {
       // After 2FA verification, determine next step based on email
       // Direct redirects to product dummy screens (for single-product users)
       if (email === 'prism@exxat.com') {
         console.log('Showing Exxat Prism dummy dashboard');
         setSelectedProduct('prism');
         return;
       } else if (email === 'exxatone@exxat.com') {
         console.log('Showing Exxat One dummy homepage');
         setSelectedProduct('one');
         return;
       }
       
       // For multi-product users, they've already selected a product, so show it
       if (selectedProduct) {
         // Product was already selected - show the selected product
         console.log(`Showing ${selectedProduct === 'prism' ? 'Exxat Prism' : 'Exxat One'} dashboard`);
         return;
       }
       
       // Default dashboard for other users
       setStep('dashboard');
    }
  };
  
  const handleForgotPassword = () => {
    setStep('forgot_password');
  };

  const handleAccountCreated = () => {
    setStep('account_created');
  };

  const handleContinueToVerification = () => {
    setStep('onboarding');
  };

  const handleVerifyCode = (code: string) => {
    console.log("Verifying code:", code);
    // Navigate to onboarding
    setStep('onboarding');
  };

  const handleOnboardingComplete = () => {
    // Set default product to 'one' if none is selected
    // In the future, this could be determined from the onboarding flow
    if (!selectedProduct) {
      setSelectedProduct('one');
    }
    setIsFirstTimeUser(true);
    setStep('exxat_one_homepage');
  };

  const handleDashboard = (firstName?: string) => {
    if (firstName) {
      setUserName(firstName);
    }
    setStep('dashboard');
  };

  const handleSSORedirect = (provider: string) => {
    console.log(`SSO redirect to provider: ${provider}`);
    setStep('sso_redirect');
  };

  const handleSSOComplete = () => {
    console.log('SSO authentication completed - showing Prism dashboard');
    setSelectedProduct('prism');
  };

  const handleLogout = () => {
    setEmail("");
    setUserName("");
    setStep('email');
  };

  return (
    <div className="login-hero-bg relative flex w-full h-screen overflow-hidden font-sans">
      {/* Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          className="w-full h-full opacity-60 mix-blend-overlay"
          viewBox="0 0 1280 812"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_n_2361_16649)">
            <rect width="100%" height="100%" fill="var(--muted)" fillOpacity="0.2" />
          </g>
          <defs>
            <filter
              id="filter0_n_2361_16649"
              x="0"
              y="0"
              width="100%"
              height="100%"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="2 2"
                stitchTiles="stitch"
                numOctaves="3"
                result="noise"
                seed="4395"
              />
              <feColorMatrix
                in="noise"
                type="luminanceToAlpha"
                result="alphaNoise"
              />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA
                  type="discrete"
                  tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
                />
              </feComponentTransfer>
              <feComposite
                operator="in"
                in2="shape"
                in="coloredNoise1"
                result="noise1Clipped"
              />
              <feFlood floodColor="color-mix(in oklch, var(--foreground) 25%, transparent)" result="color1Flood" />
              <feComposite
                operator="in"
                in2="noise1Clipped"
                in="color1Flood"
                result="color1"
              />
              <feMerge result="effect1_noise_2361_16649">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      <MarketingCarousel
        visible={step !== 'welcome' && step !== 'dashboard' && step !== 'onboarding' && step !== 'exxat_one_homepage' && step !== 'simple_homepage' && selectedProduct === null}
        isStudentOnboarding={isStudentOnboarding}
      />

      {step === 'onboarding' && (
        <div className="absolute inset-0 z-50 bg-white">
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkipToHomepage={() => setStep('simple_homepage')}
            userName={userName}
            product={selectedProduct || 'one'}
          />
        </div>
      )}
      
      {step === 'exxat_one_homepage' && (
        <div className="absolute inset-0 z-50 bg-white">
          <ExxatOneHomepage
            isFirstTimeUser={isFirstTimeUser}
            userName={userName}
          />
        </div>
      )}

      {step === 'simple_homepage' && (
        <div className="absolute inset-0 z-50 bg-white">
          <SimpleHomepage
            onBackToSignIn={handleRestart}
            isFirstTimeUser={isFirstTimeUser}
            userName={userName}
          />
        </div>
      )}

      {step === 'dashboard' ? (
        <Dashboard 
          userName={userName}
          email={email}
          onLogout={handleLogout}
        />
      ) : step !== 'onboarding' && step !== 'exxat_one_homepage' && step !== 'simple_homepage' && (
        <SignInSide 
          step={step}
          email={email}
          onEmailChange={setEmail}
          onNext={handleNext}
          onBack={handleBack}
          onRestart={handleRestart}
          onSignIn={handleSignIn}
          onForgotPassword={handleForgotPassword}
          onAccountCreated={handleAccountCreated}
          onContinueToVerification={handleContinueToVerification}
          onVerifyCode={handleVerifyCode}
          onOnboardingComplete={handleOnboardingComplete}
          onDashboard={handleDashboard}
          onSSORedirect={handleSSORedirect}
          onSSOComplete={handleSSOComplete}
          selectedProduct={selectedProduct}
          onProductSelected={setSelectedProduct}
          onStudentOnboardingChange={setIsStudentOnboarding}
        />
      )}
    </div>
  );
}