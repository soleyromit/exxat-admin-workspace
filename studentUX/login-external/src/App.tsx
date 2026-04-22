import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MarketingCarousel } from "./components/MarketingCarousel";
import { SignInSide } from "./components/SignInSide";
import OnboardingFlow from "./components/OnboardingFlow";

const DEFAULT_REDIRECT_URL = "https://2e71f5c5.exxat-one-student-ux-3q8.pages.dev/";

export default function App() {
  const [step, setStep] = useState<'email' | 'password' | 'two_factor_auth' | 'signup' | 'role_selection' | 'forgot_password' | 'account_created' | 'onboarding' | 'welcome' | 'dashboard' | 'sso_redirect' | 'product_selection'>('email');
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<'prism' | 'one' | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isStudentOnboarding, setIsStudentOnboarding] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(() => {
    try {
      return localStorage.getItem('exxat_redirect_url') || DEFAULT_REDIRECT_URL;
    } catch {
      return DEFAULT_REDIRECT_URL;
    }
  });
  const [showRedirectSettings, setShowRedirectSettings] = useState(false);
  const [tempRedirectUrl, setTempRedirectUrl] = useState(redirectUrl);

  // Persist redirect URL
  useEffect(() => {
    try {
      localStorage.setItem('exxat_redirect_url', redirectUrl);
    } catch {}
  }, [redirectUrl]);

  const openRedirectUrl = () => {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  };

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
       // After 2FA verification, redirect to external URL
       openRedirectUrl();
       return;
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
    if (!selectedProduct) {
      setSelectedProduct('one');
    }
    setIsFirstTimeUser(true);
    // Redirect to external URL after onboarding
    openRedirectUrl();
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
    console.log('SSO authentication completed - redirecting to external URL');
    openRedirectUrl();
  };

  const handleLogout = () => {
    setEmail("");
    setUserName("");
    setStep('email');
  };

  return (
    <div
      className="relative flex w-full h-screen overflow-hidden font-sans"
      style={{
        background:
          "radial-gradient(2115.19% 433.84% at 50.9% 425%, rgba(247, 247, 247, 0.00) 57.94%, #F7F7F7 100%), linear-gradient(89deg, #F86FAF -3.47%, #F7B8A1 14.97%, #EDDB92 76.29%, #A4D2F4 92.43%)",
      }}
    >
      {/* Redirect URL Settings Panel */}
      {showRedirectSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-gray-900">Redirect URL Settings</h3>
              <button
                onClick={() => {
                  setShowRedirectSettings(false);
                  setTempRedirectUrl(redirectUrl);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">
              After successful authentication, users will be redirected to this URL in a new tab.
            </p>
            <label className="block text-[13px] text-gray-700 mb-1.5">Redirect URL</label>
            <input
              type="url"
              value={tempRedirectUrl}
              onChange={(e) => setTempRedirectUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-[48px] px-4 rounded-xl border border-gray-300 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:border-transparent transition-all"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setTempRedirectUrl(DEFAULT_REDIRECT_URL);
                  setRedirectUrl(DEFAULT_REDIRECT_URL);
                  setShowRedirectSettings(false);
                }}
                className="flex-1 h-[40px] rounded-lg border border-gray-300 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => {
                  if (tempRedirectUrl.trim()) {
                    setRedirectUrl(tempRedirectUrl.trim());
                  }
                  setShowRedirectSettings(false);
                }}
                className="flex-1 h-[40px] rounded-lg bg-[#3F51B5] text-[13px] text-white hover:bg-[#354499] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Gear - always visible */}
      <button
        onClick={() => {
          setTempRedirectUrl(redirectUrl);
          setShowRedirectSettings(true);
        }}
        className="fixed top-4 right-4 z-[90] size-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur border border-gray-200 shadow-sm hover:bg-white hover:shadow-md transition-all group"
        aria-label="Redirect URL settings"
        title={`Redirect: ${redirectUrl}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#3F51B5] transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

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
            <rect width="100%" height="100%" fill="#F7F7F7" fillOpacity="0.2" />
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
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
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
        visible={step !== 'welcome' && step !== 'dashboard' && step !== 'onboarding'}
        isStudentOnboarding={isStudentOnboarding}
      />

      {step === 'onboarding' && (
        <div className="absolute inset-0 z-50 bg-white">
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkipToHomepage={() => openRedirectUrl()}
            userName={userName}
            product={selectedProduct || 'one'}
          />
        </div>
      )}
      
      {/* Remove exxat_one_homepage and simple_homepage since we redirect externally now */}

      {step !== 'onboarding' && (
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