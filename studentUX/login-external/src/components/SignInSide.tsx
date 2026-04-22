import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "motion/react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { studentRoleImage as studentImage, employerRoleImage as employerImage } from "../assets/images";
import ExxatPrismLogo from "../imports/ExxatPrismLogo";
import ExxatOneLogo from "../imports/ExxatOneLogo";
import Footer from "../imports/Footer-8178-1356";
import { UserProfileCard } from "./UserProfileCard";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "./ui/utils";
import { SSORedirect } from "./SSORedirect";
import { AccordionAuth } from "./AccordionAuth";
import GettingStartedWrapper from "./GettingStartedWrapper";

interface SignInSideProps {
  step: 'email' | 'password' | 'two_factor_auth' | 'signup' | 'role_selection' | 'forgot_password' | 'account_created' | 'onboarding' | 'welcome' | 'sso_redirect' | 'product_selection';
  email: string;
  onEmailChange: (email: string) => void;
  onNext: (nextStep?: 'password' | 'signup' | 'product_selection') => void;
  onBack: () => void;
  onRestart: () => void;
  onSignIn: () => void;
  onForgotPassword: () => void;
  onAccountCreated?: () => void;
  onContinueToVerification?: () => void;
  onVerifyCode?: (code: string) => void;
  onOnboardingComplete?: () => void;
  onDashboard?: (firstName?: string) => void;
  onSSORedirect?: (provider: string) => void;
  onSSOComplete?: () => void;
  selectedProduct: 'prism' | 'one' | null;
  onProductSelected: (product: 'prism' | 'one' | null) => void;
  onStudentOnboardingChange?: (isOnboarding: boolean) => void;
}

interface Role {
  id: string;
  image: string;
  label: string;
}

const graduationYears = [
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028" },
  { value: "2029", label: "2029" },
];

const graduationDates = [
  // 2024
  { value: "01/2024", label: "01/2024", searchLabel: "January 2024" },
  { value: "02/2024", label: "02/2024", searchLabel: "February 2024" },
  { value: "03/2024", label: "03/2024", searchLabel: "March 2024" },
  { value: "04/2024", label: "04/2024", searchLabel: "April 2024" },
  { value: "05/2024", label: "05/2024", searchLabel: "May 2024" },
  { value: "06/2024", label: "06/2024", searchLabel: "June 2024" },
  { value: "07/2024", label: "07/2024", searchLabel: "July 2024" },
  { value: "08/2024", label: "08/2024", searchLabel: "August 2024" },
  { value: "09/2024", label: "09/2024", searchLabel: "September 2024" },
  { value: "10/2024", label: "10/2024", searchLabel: "October 2024" },
  { value: "11/2024", label: "11/2024", searchLabel: "November 2024" },
  { value: "12/2024", label: "12/2024", searchLabel: "December 2024" },
  // 2025
  { value: "01/2025", label: "01/2025", searchLabel: "January 2025" },
  { value: "02/2025", label: "02/2025", searchLabel: "February 2025" },
  { value: "03/2025", label: "03/2025", searchLabel: "March 2025" },
  { value: "04/2025", label: "04/2025", searchLabel: "April 2025" },
  { value: "05/2025", label: "05/2025", searchLabel: "May 2025" },
  { value: "06/2025", label: "06/2025", searchLabel: "June 2025" },
  { value: "07/2025", label: "07/2025", searchLabel: "July 2025" },
  { value: "08/2025", label: "08/2025", searchLabel: "August 2025" },
  { value: "09/2025", label: "09/2025", searchLabel: "September 2025" },
  { value: "10/2025", label: "10/2025", searchLabel: "October 2025" },
  { value: "11/2025", label: "11/2025", searchLabel: "November 2025" },
  { value: "12/2025", label: "12/2025", searchLabel: "December 2025" },
  // 2026
  { value: "01/2026", label: "01/2026", searchLabel: "January 2026" },
  { value: "02/2026", label: "02/2026", searchLabel: "February 2026" },
  { value: "03/2026", label: "03/2026", searchLabel: "March 2026" },
  { value: "04/2026", label: "04/2026", searchLabel: "April 2026" },
  { value: "05/2026", label: "05/2026", searchLabel: "May 2026" },
  { value: "06/2026", label: "06/2026", searchLabel: "June 2026" },
  { value: "07/2026", label: "07/2026", searchLabel: "July 2026" },
  { value: "08/2026", label: "08/2026", searchLabel: "August 2026" },
  { value: "09/2026", label: "09/2026", searchLabel: "September 2026" },
  { value: "10/2026", label: "10/2026", searchLabel: "October 2026" },
  { value: "11/2026", label: "11/2026", searchLabel: "November 2026" },
  { value: "12/2026", label: "12/2026", searchLabel: "December 2026" },
  // 2027
  { value: "01/2027", label: "01/2027", searchLabel: "January 2027" },
  { value: "02/2027", label: "02/2027", searchLabel: "February 2027" },
  { value: "03/2027", label: "03/2027", searchLabel: "March 2027" },
  { value: "04/2027", label: "04/2027", searchLabel: "April 2027" },
  { value: "05/2027", label: "05/2027", searchLabel: "May 2027" },
  { value: "06/2027", label: "06/2027", searchLabel: "June 2027" },
  { value: "07/2027", label: "07/2027", searchLabel: "July 2027" },
  { value: "08/2027", label: "08/2027", searchLabel: "August 2027" },
  { value: "09/2027", label: "09/2027", searchLabel: "September 2027" },
  { value: "10/2027", label: "10/2027", searchLabel: "October 2027" },
  { value: "11/2027", label: "11/2027", searchLabel: "November 2027" },
  { value: "12/2027", label: "12/2027", searchLabel: "December 2027" },
  // 2028
  { value: "01/2028", label: "01/2028", searchLabel: "January 2028" },
  { value: "02/2028", label: "02/2028", searchLabel: "February 2028" },
  { value: "03/2028", label: "03/2028", searchLabel: "March 2028" },
  { value: "04/2028", label: "04/2028", searchLabel: "April 2028" },
  { value: "05/2028", label: "05/2028", searchLabel: "May 2028" },
  { value: "06/2028", label: "06/2028", searchLabel: "June 2028" },
  { value: "07/2028", label: "07/2028", searchLabel: "July 2028" },
  { value: "08/2028", label: "08/2028", searchLabel: "August 2028" },
  { value: "09/2028", label: "09/2028", searchLabel: "September 2028" },
  { value: "10/2028", label: "10/2028", searchLabel: "October 2028" },
  { value: "11/2028", label: "11/2028", searchLabel: "November 2028" },
  { value: "12/2028", label: "12/2028", searchLabel: "December 2028" },
  // 2029
  { value: "01/2029", label: "01/2029", searchLabel: "January 2029" },
  { value: "02/2029", label: "02/2029", searchLabel: "February 2029" },
  { value: "03/2029", label: "03/2029", searchLabel: "March 2029" },
  { value: "04/2029", label: "04/2029", searchLabel: "April 2029" },
  { value: "05/2029", label: "05/2029", searchLabel: "May 2029" },
  { value: "06/2029", label: "06/2029", searchLabel: "June 2029" },
  { value: "07/2029", label: "07/2029", searchLabel: "July 2029" },
  { value: "08/2029", label: "08/2029", searchLabel: "August 2029" },
  { value: "09/2029", label: "09/2029", searchLabel: "September 2029" },
  { value: "10/2029", label: "10/2029", searchLabel: "October 2029" },
  { value: "11/2029", label: "11/2029", searchLabel: "November 2029" },
  { value: "12/2029", label: "12/2029", searchLabel: "December 2029" },
];

const sources = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "friend", label: "Friend or Colleague" },
  { value: "school", label: "School / University" },
  { value: "event", label: "Event / Conference" },
  { value: "prism", label: "Prism" },
  { value: "exxat_website", label: "Exxat Website" },
  { value: "other", label: "Other" },
];

const disciplines = [
  { value: "nursing", label: "Nursing" },
  { value: "physical_therapy", label: "Physical Therapy" },
  { value: "occupational_therapy", label: "Occupational Therapy" },
  { value: "speech_language_pathology", label: "Speech-Language Pathology" },
  { value: "athletic_training", label: "Athletic Training" },
  { value: "physician_assistant", label: "Physician Assistant" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "medical_school", label: "Medical School" },
  { value: "dental", label: "Dental" },
  { value: "veterinary", label: "Veterinary" },
  { value: "nutrition_dietetics", label: "Nutrition & Dietetics" },
  { value: "social_work", label: "Social Work" },
  { value: "psychology", label: "Psychology" },
  { value: "counseling", label: "Counseling" },
  { value: "radiologic_technology", label: "Radiologic Technology" },
  { value: "respiratory_therapy", label: "Respiratory Therapy" },
  { value: "medical_laboratory_science", label: "Medical Laboratory Science" },
  { value: "public_health", label: "Public Health" },
  { value: "health_administration", label: "Health Administration" },
  { value: "other", label: "Other" },
];

const countries = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
];

export const SignInSide = ({
  step,
  email,
  onEmailChange,
  onNext,
  onBack,
  onRestart,
  onSignIn,
  onForgotPassword,
  onAccountCreated,
  onContinueToVerification,
  onVerifyCode,
  onOnboardingComplete,
  onDashboard,
  onSSORedirect,
  onSSOComplete,
  selectedProduct,
  onProductSelected,
  onStudentOnboardingChange
}: SignInSideProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState({ firstName: '', lastName: '', discipline: '', graduationDate: '', password: '' });
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [graduationDateOpen, setGraduationDateOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<'student' | 'school' | null>(null);
  
  // Password state for login
  const [password, setPassword] = useState('');
  
  // Login attempt tracking and error state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Forgot Password local state
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Email Verification local state
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showResendToast, setShowResendToast] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  
  // 2FA state
  const [twoFactorMethod, setTwoFactorMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+1',
    country: 'US',
    flag: '🇺🇸',
    name: 'United States'
  });
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorResendCooldown, setTwoFactorResendCooldown] = useState(0);
  const [showTwoFactorToast, setShowTwoFactorToast] = useState(false);
  
  // Signup card selection state
  const [signupCardType, setSignupCardType] = useState<'student' | 'school' | null>(null);
  // Accordion state - controls which section is expanded
  const [expandedSection, setExpandedSection] = useState<'signin' | 'student' | 'school'>('signin');
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const phoneDebounceTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showRememberDeviceInfo, setShowRememberDeviceInfo] = useState(false);
  const [isDeviceTrusted, setIsDeviceTrusted] = useState(false);

  // Elite feature states
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidationState, setEmailValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Onboarding local state
  const [onboardingData, setOnboardingData] = useState({
    gradYear: "",
    gradMonth: "",
    intent: "",
    heardFrom: ""
  });
  const [yearOpen, setYearOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  // Email recognition state
  const [ssoProvider, setSSOProvider] = useState<string | null>(null);
  
  // Account not found animation trigger
  const [triggerAccountNotFoundAnimation, setTriggerAccountNotFoundAnimation] = useState(false);

  // Join Network card state
  const [isJoinNetworkExpanded, setIsJoinNetworkExpanded] = useState(false);
  const [joinNetworkEmail, setJoinNetworkEmail] = useState('');
  const [joinNetworkEmailError, setJoinNetworkEmailError] = useState<string | null>(null);

  // Track previous expanded section for contextual error clearing
  const prevExpandedSectionRef = React.useRef<'signin' | 'student' | 'school'>('signin');
  
  // Track product choice during auth flow (separate from final selectedProduct)
  const [pendingProductSelection, setPendingProductSelection] = useState<'prism' | 'one' | null>(null);
  
  // Auto-capitalize helper function for name fields
  const capitalizeFirstLetter = (value: string): string => {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };
  
  // Shimmer effect for guiding user to sign in when existing account detected
  const [shouldShimmerSignIn, setShouldShimmerSignIn] = useState(false);

  // Contextual error clearing when switching between accordion sections
  useEffect(() => {
    const prevSection = prevExpandedSectionRef.current;
    const currentSection = expandedSection;
    
    // Only clear error if there's an existing error and user switched sections
    if (emailError && prevSection !== currentSection) {
      const isExistingAccountError = emailError.includes('already associated with an existing account');
      const isNotRegisteredError = emailError.includes("isn't registered yet");
      
      // Determine if this is a contextual switch (clear error)
      const isContextualSwitch = 
        // From student/school with existing account error → signin
        (isExistingAccountError && 
         (prevSection === 'student' || prevSection === 'school') && 
         currentSection === 'signin') ||
        // From signin with not registered error → student/school
        (isNotRegisteredError && 
         prevSection === 'signin' && 
         (currentSection === 'student' || currentSection === 'school'));
      
      if (isContextualSwitch) {
        // Clear the error for contextual switches
        setEmailError(null);
        setEmailValidationState('idle');
        setSignupCardType(null); // Reset signup card type
        setShouldShimmerSignIn(false); // Stop shimmer when user switches to signin
      }
      // For non-contextual switches, keep the error and email prefilled
    }
    
    // Update the ref to current section
    prevExpandedSectionRef.current = currentSection;
  }, [expandedSection, emailError]);

  // Trigger shimmer effect when existing account error appears on non-signin cards
  useEffect(() => {
    const isExistingAccountError = emailError?.includes('already associated with an existing account');
    const isOnNonSignInCard = expandedSection !== 'signin';
    
    if (isExistingAccountError && isOnNonSignInCard) {
      setShouldShimmerSignIn(true);
    } else if (!isExistingAccountError) {
      setShouldShimmerSignIn(false);
    }
  }, [emailError, expandedSection]);

  // Notify parent when student onboarding mode is active
  useEffect(() => {
    if (onStudentOnboardingChange) {
      onStudentOnboardingChange(signupCardType === 'student');
    }
  }, [signupCardType, onStudentOnboardingChange]);

  // Check email authentication type based on domain
  const checkEmailAuthType = (emailToCheck: string): 'password' | 'sso' | 'unknown' => {
    const lowerEmail = emailToCheck.toLowerCase().trim();
    
    // Special case: sso@sso.com → SSO authentication
    if (lowerEmail === 'sso@sso.com') {
      return 'sso';
    }
    
    // Check if it's an @exxat.com email - Use-case 1: Password authentication
    if (lowerEmail.endsWith('@exxat.com')) {
      return 'password';
    }
    
    // Check if it's an @sso.com email - Use-case 2: SSO authentication
    if (lowerEmail.endsWith('@sso.com')) {
      return 'sso';
    }
    
    // All other emails are unknown
    return 'unknown';
  };

  // Device Trust Management - Enterprise-grade implementation
  const DEVICE_TRUST_KEY = 'exxat_trusted_devices';
  const TRUST_DURATION_DAYS = 30;

  // Generate device fingerprint for identification
  const generateDeviceFingerprint = () => {
    const navigator = window.navigator;
    const screen = window.screen;
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ];
    
    // Simple hash function (in production, use crypto.subtle.digest)
    const fingerprint = components.join('|');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  // Check if current device is trusted for this email
  const checkDeviceTrust = (userEmail: string): boolean => {
    try {
      const trustedDevicesStr = localStorage.getItem(DEVICE_TRUST_KEY);
      if (!trustedDevicesStr) return false;

      const trustedDevices = JSON.parse(trustedDevicesStr);
      const deviceFingerprint = generateDeviceFingerprint();
      const deviceKey = `${userEmail}_${deviceFingerprint}`;
      
      const deviceData = trustedDevices[deviceKey];
      if (!deviceData) return false;

      // Check if trust has expired
      const expiryDate = new Date(deviceData.expiresAt);
      const now = new Date();
      
      if (now > expiryDate) {
        // Remove expired trust
        delete trustedDevices[deviceKey];
        localStorage.setItem(DEVICE_TRUST_KEY, JSON.stringify(trustedDevices));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking device trust:', error);
      return false;
    }
  };

  // Save device as trusted
  const trustCurrentDevice = (userEmail: string) => {
    try {
      const trustedDevicesStr = localStorage.getItem(DEVICE_TRUST_KEY);
      const trustedDevices = trustedDevicesStr ? JSON.parse(trustedDevicesStr) : {};
      
      const deviceFingerprint = generateDeviceFingerprint();
      const deviceKey = `${userEmail}_${deviceFingerprint}`;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + TRUST_DURATION_DAYS);
      
      trustedDevices[deviceKey] = {
        email: userEmail,
        deviceFingerprint,
        trustedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        userAgent: navigator.userAgent,
      };
      
      localStorage.setItem(DEVICE_TRUST_KEY, JSON.stringify(trustedDevices));
      setIsDeviceTrusted(true);
    } catch (error) {
      console.error('Error trusting device:', error);
    }
  };

  // Remove device trust
  const forgetCurrentDevice = (userEmail: string) => {
    try {
      const trustedDevicesStr = localStorage.getItem(DEVICE_TRUST_KEY);
      if (!trustedDevicesStr) return;

      const trustedDevices = JSON.parse(trustedDevicesStr);
      const deviceFingerprint = generateDeviceFingerprint();
      const deviceKey = `${userEmail}_${deviceFingerprint}`;
      
      delete trustedDevices[deviceKey];
      localStorage.setItem(DEVICE_TRUST_KEY, JSON.stringify(trustedDevices));
      setIsDeviceTrusted(false);
    } catch (error) {
      console.error('Error forgetting device:', error);
    }
  };

  // Check device trust on mount and when step changes to password
  useEffect(() => {
    if (step === 'password' && email) {
      const isTrusted = checkDeviceTrust(email);
      setIsDeviceTrusted(isTrusted);
    }
  }, [step, email]);

  // Clear all local state when returning to email step
  useEffect(() => {
    if (step === 'email') {
      // Reset all form fields
      setPassword('');
      setShowPassword(false);
      setSignupData({ firstName: '', lastName: '', password: '' });
      setEmailError(null);
      setSignupError(null);
      setSelectedRole(null);
      setLoginAttempts(0);
      setLoginError(null);
      setResetEmail('');
      setResetEmailError(null);
      setResetEmailSent(false);
      setOtpCode('');
      setResendCooldown(0);
      setShowResendToast(false);
      setTwoFactorMethod('phone');
      setPhoneNumber('');
      setSelectedCountry({ code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' });
      setCountryPickerOpen(false);
      setTwoFactorCode('');
      setTwoFactorResendCooldown(0);
      setShowTwoFactorToast(false);
      setIsPhoneCodeSent(false);
      setRememberDevice(false);
      setShowRememberDeviceInfo(false);
      setIsDeviceTrusted(false);
      setOnboardingData({ gradYear: '', intent: '', heardFrom: '' });
      setYearOpen(false);
      setSourceOpen(false);
      setSSOProvider(null);
      setTriggerAccountNotFoundAnimation(false);
      setPendingProductSelection(null);
      // Reset elite feature states
      setIsValidatingEmail(false);
      setEmailValidationState('idle');
      setHasStartedTyping(false);
    }
  }, [step]);

  // Email validation regex
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleNextWithValidation = (cardType?: 'student' | 'school' | null) => {
    if (!email) {
      setEmailError("Email or username is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Show loading state
    setIsValidatingEmail(true);
    
    // Simulate email recognition with minimum 150ms delay for smooth UX
    setTimeout(() => {
      // Check authentication type
      const authType = checkEmailAuthType(email);
      
      // Use the passed cardType parameter if available, otherwise use state
      const currentCardType = cardType !== undefined ? cardType : signupCardType;
      
      // If this is a student signup, only allow "other domain" emails (not @exxat.com or @sso.com)
      if (currentCardType === 'student') {
        // Check if it's an existing account (@exxat.com or @sso.com)
        if (authType === 'password' || authType === 'sso') {
          setEmailError("This email is already associated with an existing account. Please sign in instead.");
          setIsValidatingEmail(false);
          setShouldShimmerSignIn(true);
          return;
        }
        
        // For other domains, proceed to signup
        setEmailError(null);
        setIsValidatingEmail(false);
        setShouldShimmerSignIn(false);
        onNext('signup');
        return;
      }
      
      // For signin card only, check if email is unknown (not an Exxat account)
      if (currentCardType === null && authType === 'unknown') {
        setEmailError("This email isn't registered yet. Try signing up as a New Student below.");
        setIsValidatingEmail(false);
        // Trigger animation after a brief pause
        setTimeout(() => {
          setTriggerAccountNotFoundAnimation(true);
        }, 800);
        return;
      }
      
      if (authType === 'sso') {
        // Extract provider name from email domain
        const domain = email.split('@')[1];
        const providerName = domain.split('.')[0];
        setSSOProvider(providerName);
        
        if (onSSORedirect) {
          onSSORedirect(providerName);
        }
        setIsValidatingEmail(false);
        return;
      }
      
      // For password auth, check if user needs product selection
      if (authType === 'password') {
        setEmailError(null);
        setIsValidatingEmail(false);
        
        const lowerEmail = email.toLowerCase().trim();
        
        // Check if user is eligible for product selection
        // Direct redirects (single product) - these skip product selection and go straight to password
        if (lowerEmail === 'prism@exxat.com') {
          setPendingProductSelection('prism');
          onNext('password');
          return;
        }
        if (lowerEmail === 'one@exxat.com') {
          setPendingProductSelection('one');
          onNext('password');
          return;
        }
        
        // Multi-product and persona selection users
        if (lowerEmail === 'exxatone@exxat.com' || lowerEmail === 'all@exxat.com' || lowerEmail === 'ssoone@exxat.com') {
          // Route to product selection
          onNext('product_selection');
          return;
        }
        
        // Other @exxat.com users (show product selection first)
        if (lowerEmail.endsWith('@exxat.com')) {
          // Route to product selection before password
          onNext('product_selection');
          return;
        }
        
        // Default: go to password
        onNext('password');
        return;
      }
      
      // Fallback for any other cases
      setEmailError("Account not found");
      setIsValidatingEmail(false);
    }, 150);
  };

  const handleEmailChange = (val: string) => {
    onEmailChange(val);
    if (emailError) setEmailError(null);
    if (selectedRole) setSelectedRole(null); // Reset role if email changes
    // Reset animation trigger when email changes
    if (triggerAccountNotFoundAnimation) setTriggerAccountNotFoundAnimation(false);
    
    // Mark that user has started typing
    if (!hasStartedTyping && val.length > 0) {
      setHasStartedTyping(true);
    }
    
    // Real-time email validation - only validate emails, not usernames
    if (val.length === 0) {
      setEmailValidationState('idle');
      setHasStartedTyping(false);
    } else if (val.includes('@')) {
      // Only validate if it looks like an email (contains @)
      if (validateEmail(val)) {
        setEmailValidationState('valid');
      } else {
        setEmailValidationState('idle'); // Don't show invalid state during typing
      }
    } else {
      // No @ symbol means it could be a username - keep idle state
      setEmailValidationState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'email') handleNextWithValidation();
      else if (step === 'password') handleSignInAttempt();
    }
  };

  // Format phone number based on country code
  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format based on country
    if (countryCode === '+1') {
      // US/Canada format: (XXX) XXX-XXXX - Standard 10-digit format
      // Limit to exactly 10 digits
      const limited = cleaned.slice(0, 10);
      
      if (limited.length === 0) return '';
      if (limited.length <= 3) return limited;
      if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
    
    // Default: just return cleaned numbers with spacing every 3-4 digits
    return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.code);
    setPhoneNumber(formatted);
    
    // Reset code sent state when user edits phone number
    if (isPhoneCodeSent) {
      setIsPhoneCodeSent(false);
      setTwoFactorCode('');
    }
    
    // Clear any existing debounce timer
    if (phoneDebounceTimer.current) {
      clearTimeout(phoneDebounceTimer.current);
    }
    
    // For US/Canada numbers, auto-send when complete (14 chars including formatting)
    if (selectedCountry.code === '+1' && formatted.length === 14) {
      // Debounce for 500ms to allow quick corrections
      phoneDebounceTimer.current = setTimeout(() => {
        setIsPhoneCodeSent(true);
        setTwoFactorResendCooldown(30);
        setShowTwoFactorToast(true);
        setTimeout(() => setShowTwoFactorToast(false), 3000);
        console.log("Auto-sending code to:", formatted);
      }, 500);
    }
  };

  // Handle sign in with progressive error messaging
  const handleSignInAttempt = () => {
    // Check if password contains at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const hasSpecialChar = specialCharRegex.test(password);
    
    if (!hasSpecialChar) {
      // Password doesn't contain a special character - show error
      setLoginAttempts(prev => prev + 1);
      setLoginError('invalid');
    } else {
      // Password contains special character - proceed
      setLoginError(null);
      setLoginAttempts(0);
      
      // Don't set product selection yet - wait until after 2FA
      // The product selection will be set in the 2FA verification handler
      
      // Always proceed to 2FA (device trust check removed per user requirement)
      onSignIn();
    }
  };

  const getHeader = () => {
    switch (step) {
      case 'email':
        return 'One platform. Many journeys. Let’s begin.';
      case 'signup':
        return 'Create your account';
      case 'role_selection':
        return 'Select your role';
      case 'two_factor_auth':
        return 'Two-Factor Authentication';
      case 'forgot_password':
        return resetEmailSent ? 'Email Sent' : 'Reset your password';
      case 'onboarding':
        return 'Tell us a bit about yourself';
      case 'sso_redirect':
        return 'Signing in with SSO';
      case 'welcome':
        return '';
      default:
        return 'Welcome back!';
    }
  };

  // Helper to check password strength
  const getPasswordStrength = (pass: string) => {
    const criteria = [
      pass.length >= 8, // Length
      /[A-Z]/.test(pass), // Uppercase
      /[a-z]/.test(pass), // Lowercase
      /[0-9]/.test(pass), // Number
      /[^A-Za-z0-9]/.test(pass) // Special char
    ];
    return criteria;
  };

  const strengthCriteria = getPasswordStrength(signupData.password);
  const strengthScore = strengthCriteria.filter(Boolean).length;
  const strengthPercent = (strengthScore / 5) * 100;
  
  let strengthColor = "bg-red-500";
  if (strengthScore >= 3) strengthColor = "bg-yellow-500";
  if (strengthScore >= 5) strengthColor = "bg-green-500";


  const roleCards: Role[] = [
    {
      id: 'Student',
      image: studentImage,
      label: 'Student',
    },
    {
      id: 'Employer',
      image: employerImage,
      label: 'Employer',
    }
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    onSignIn(); // Proceed to next step (password)
  };

  const handleCreateAccount = () => {
     if (!signupData.firstName || !signupData.lastName || !signupData.password) {
       setSignupError("All fields are required");
       return;
     }
     if (strengthScore < 5) {
       setSignupError("Please meet all password requirements");
       return;
     }
     setSignupError(null);
     // Proceed with account creation
     console.log("Account created", signupData);
     
     if (onAccountCreated) {
       onAccountCreated();
     }
  };

  const handleSendResetLink = () => {
    if (!resetEmail) {
      setResetEmailError("Email is required");
      return;
    }
    if (!validateEmail(resetEmail)) {
      setResetEmailError("Please enter a valid email address");
      return;
    }
    // Simulate API call
    setTimeout(() => {
        setResetEmailSent(true);
    }, 500);
  };

  const handleVerify = () => {
    if (otpCode.length === 6 && onVerifyCode) {
      onVerifyCode(otpCode);
    }
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setShowResendToast(true);
    setTimeout(() => setShowResendToast(false), 3000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // 2FA resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (twoFactorResendCooldown > 0) {
      interval = setInterval(() => {
        setTwoFactorResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [twoFactorResendCooldown]);

  // Initialize 2FA resend cooldown when 2FA step loads
  useEffect(() => {
    if (step === 'two_factor_auth') {
      // Set initial cooldown: 30s for phone, 60s for email
      const initialCooldown = twoFactorMethod === 'phone' ? 30 : 60;
      setTwoFactorResendCooldown(initialCooldown);
    }
  }, [step, twoFactorMethod]);

  // Initialize email verification resend cooldown when account_created step loads
  useEffect(() => {
    if (step === 'account_created') {
      // Set initial cooldown: 60s for email verification
      setResendCooldown(60);
    }
  }, [step]);

  // Cleanup phone debounce timer on unmount
  useEffect(() => {
    return () => {
      if (phoneDebounceTimer.current) {
        clearTimeout(phoneDebounceTimer.current);
      }
    };
  }, []);

  const handleOnboardingSubmit = () => {
    if (onOnboardingComplete) {
      onOnboardingComplete();
    }
  };

  // Common input classes
  const inputClasses = "pl-10 h-[48px] rounded-xl border-[#8c8c92] bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-[16px] placeholder:text-muted-foreground";

  const isWelcome = step === 'welcome';

  // If we're on the welcome screen, render the full Getting Started component
  if (isWelcome) {
    return <GettingStartedWrapper onGetStarted={() => onDashboard?.(signupData.firstName)} selectedProduct={selectedProduct} />;
  }

  return (
    <motion.div 
      layout
      className={cn(
        "flex flex-col bg-background items-center justify-center p-6 lg:p-12 transition-all duration-700 ease-in-out",
        selectedProduct
          ? "w-full h-full"
          : "relative w-full lg:w-[42%] ml-auto h-full"
      )}
    >
      {selectedProduct ? (
        <div className="w-full flex flex-col items-center text-center gap-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FontAwesomeIcon name="check" className="text-5xl text-primary" />
          </div>
          
          <div className="flex flex-col gap-3">
            <h1 className="text-[40px] font-bold text-foreground/40 leading-tight tracking-tight">
              {selectedProduct === 'prism' ? 'Exxat Prism Dashboard' : 'Exxat One Homepage'}
            </h1>
          </div>

          <div className="w-full max-w-sm">
            <Button 
              onClick={() => {
                onEmailChange("");
                onRestart();
              }}
              className="w-full h-[48px] rounded-xl font-medium bg-black text-white hover:bg-black/90"
            >
              Back to login.exxat.com
            </Button>
          </div>
        </div>
      ) : (
      <>
      {/* Login Card Content */}
      <div className={`w-full max-w-[420px] flex flex-col gap-10 ${step === 'forgot_password' && resetEmailSent ? 'items-center text-center' : ''}`}>
        
        {/* Header */}
        {step !== 'email' && (
          <div className={`flex flex-col gap-1 ${step === 'forgot_password' && resetEmailSent ? 'items-center' : ''}`}>
            {/* Success Icon for Forgot Password */}
            {step === 'forgot_password' && resetEmailSent && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon name="circleCheck" className="text-xl text-green-600 shrink-0" />
              </div>
            )}
            
            {/* Show hero text when card is selected */}
            
            <motion.h1 
              key={`header-${signupCardType || 'default'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "font-bold text-foreground tracking-[-0.08px]",
                step === 'email' 
                  ? "text-[28px] leading-[36px]" 
                  : "text-[20px] leading-[28px]"
              )}
            >
              {step === 'email' ? (
                <>
                  {expandedSection === 'student' 
                    ? 'Join the Exxat One Network' 
                    : expandedSection === 'school'
                    ? 'Contact Sales'
                    : 'Access all your Exxat products'}
                </>
              ) : step === 'product_selection' ? (
                <>
                  Choose a product to continue
                </>
              ) : step === 'account_created' ? (
                <>
                  Verify your email
                </>
              ) : (
                getHeader()
              )}
            </motion.h1>
            
            {step === 'email' && (
              <motion.p 
                key={`description-${expandedSection}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-muted-foreground"
              >
                {expandedSection === 'student' 
                  ? 'Enter your email to create your account'
                  : expandedSection === 'school'
                  ? 'Enter your email to contact our sales team'
                  : 'Enter your email or username to sign in'
                }
              </motion.p>
            )}
            
            {step === 'product_selection' && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-muted-foreground"
              >
                Select the product you'd like to access
              </motion.p>
            )}
          </div>
        )}

        {/* Form Container */}
        <div className="flex flex-col gap-6 w-full">
          
          {step === 'email' && (
            <>
              <AccordionAuth
                email={email}
                onEmailChange={onEmailChange}
                onKeyDown={handleKeyDown}
                handleNextWithValidation={handleNextWithValidation}
                handleEmailChange={handleEmailChange}
                setSignupCardType={setSignupCardType}
                inputClasses={inputClasses}
                emailError={emailError}
                emailValidationState={emailValidationState}
                isValidatingEmail={isValidatingEmail}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
                shouldShimmerSignIn={shouldShimmerSignIn}
              />
            </>
          )}

          {step === 'signup' && (
            <>
              {/* Email Display */}
               <div className="relative w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon name="envelope" className="text-xl text-muted-foreground shrink-0" />
                  <span className="text-foreground text-[18px]">
                    {email}
                  </span>
                </div>
                <button 
                  onClick={onBack}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded text-[14px] font-medium text-foreground"
                >
                  <FontAwesomeIcon name="refresh" className="text-sm text-muted-foreground shrink-0" />
                  <span>Change</span>
                </button>
              </div>

              {/* Name Fields Split */}
              <div className="flex gap-3 w-full">
                <div className="relative w-full">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FontAwesomeIcon name="user" className="text-lg text-muted-foreground" />
                   </div>
                   <Input
                    type="text"
                    placeholder="First Name"
                    value={signupData.firstName}
                    onChange={(e) => {
                        const value = e.target.value;
                        const capitalizedValue = signupData.firstName === '' ? capitalizeFirstLetter(value) : value;
                        setSignupData({...signupData, firstName: capitalizedValue});
                        if(signupError) setSignupError(null);
                    }}
                    className={inputClasses}
                    autoComplete="off"
                  />
                </div>
                <div className="relative w-full">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <FontAwesomeIcon name="user" className="text-lg text-muted-foreground" />
                   </div>
                   <Input
                    type="text"
                    placeholder="Last Name"
                    value={signupData.lastName}
                    onChange={(e) => {
                        const value = e.target.value;
                        const capitalizedValue = signupData.lastName === '' ? capitalizeFirstLetter(value) : value;
                        setSignupData({...signupData, lastName: capitalizedValue});
                        if(signupError) setSignupError(null);
                    }}
                    className={inputClasses}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Discipline Field */}
              <div className="flex flex-col gap-1.5">
                <Popover open={disciplineOpen} onOpenChange={setDisciplineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={disciplineOpen}
                      className="w-full h-[48px] justify-start rounded-xl border-[#8c8c92] bg-background hover:bg-background hover:border-[#8c8c92] pl-3 pr-3 font-normal border text-base"
                    >
                      <FontAwesomeIcon name="graduationCap" className="text-lg text-muted-foreground mr-2.5" />
                      <span className={cn("flex-1 text-left", signupData.discipline ? "text-foreground" : "text-muted-foreground")}>
                        {signupData.discipline
                          ? disciplines.find((disc) => disc.value === signupData.discipline)?.label
                          : "Discipline"}
                      </span>
                      <FontAwesomeIcon name="chevronDown" className="text-sm text-muted-foreground ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-0">
                    <Command>
                      <CommandInput placeholder="Search discipline..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No discipline found.</CommandEmpty>
                        <CommandGroup>
                          {disciplines.map((discipline) => (
                            <CommandItem
                              key={discipline.value}
                              value={discipline.value}
                              onSelect={(currentValue) => {
                                setSignupData({ ...signupData, discipline: currentValue === signupData.discipline ? "" : currentValue });
                                setDisciplineOpen(false);
                                if(signupError) setSignupError(null);
                              }}
                            >
                              {discipline.label}
                              <FontAwesomeIcon 
                                name="check" 
                                className={cn(
                                  "ml-auto text-primary",
                                  signupData.discipline === discipline.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Graduation Date Field */}
              <div className="flex flex-col gap-1.5">
                <Popover open={graduationDateOpen} onOpenChange={setGraduationDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={graduationDateOpen}
                      className="w-full h-[48px] justify-start rounded-xl border-[#8c8c92] bg-background hover:bg-background hover:border-[#8c8c92] pl-3 pr-3 font-normal border text-base"
                    >
                      <FontAwesomeIcon name="calendarAlt" className="text-lg text-muted-foreground mr-2.5" />
                      <span className={cn("flex-1 text-left", signupData.graduationDate ? "text-foreground" : "text-muted-foreground")}>
                        {signupData.graduationDate
                          ? graduationDates.find((date) => date.value === signupData.graduationDate)?.label
                          : "Expected Graduation (MM/YYYY)"}
                      </span>
                      <FontAwesomeIcon name="chevronDown" className="text-sm text-muted-foreground ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-0">
                    <Command>
                      <CommandInput placeholder="Search graduation date..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No date found.</CommandEmpty>
                        <CommandGroup>
                          {graduationDates.map((date) => (
                            <CommandItem
                              key={date.value}
                              value={date.searchLabel}
                              onSelect={() => {
                                setSignupData({ ...signupData, graduationDate: date.value === signupData.graduationDate ? "" : date.value });
                                setGraduationDateOpen(false);
                                if(signupError) setSignupError(null);
                              }}
                            >
                              {date.label}
                              <FontAwesomeIcon 
                                name="check" 
                                className={cn(
                                  "ml-auto text-primary",
                                  signupData.graduationDate === date.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

               {/* Password Field */}
              <div className="relative w-full">
                <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <FontAwesomeIcon name="lock" className="text-lg text-muted-foreground" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={signupData.password}
                    onChange={(e) => {
                        setSignupData({...signupData, password: e.target.value});
                        if(signupError) setSignupError(null);
                    }}
                    className={`${inputClasses} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:text-foreground text-muted-foreground"
                  >
                    {showPassword ? <FontAwesomeIcon name="eyeSlash" className="text-lg" /> : <FontAwesomeIcon name="eye" className="text-lg" />}
                  </button>
                </div>
                
                {/* Password Strength Guide */}
                {signupData.password.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                       <div 
                        className={`h-full transition-all duration-500 ease-out ${strengthColor}`} 
                        style={{ width: `${Math.max(5, strengthPercent)}%` }} 
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <div className={`text-[11px] flex items-center gap-1.5 ${strengthCriteria[0] ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${strengthCriteria[0] ? 'bg-green-600' : 'bg-muted-foreground/40'}`} />
                        At least 8 characters
                      </div>
                      <div className={`text-[11px] flex items-center gap-1.5 ${strengthCriteria[1] ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${strengthCriteria[1] ? 'bg-green-600' : 'bg-muted-foreground/40'}`} />
                        Uppercase letter
                      </div>
                      <div className={`text-[11px] flex items-center gap-1.5 ${strengthCriteria[2] ? 'text-green-600' : 'text-muted-foreground'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${strengthCriteria[2] ? 'bg-green-600' : 'bg-muted-foreground/40'}`} />
                        Lowercase letter
                      </div>
                      <div className={`text-[11px] flex items-center gap-1.5 ${strengthCriteria[3] ? 'text-green-600' : 'text-muted-foreground'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${strengthCriteria[3] ? 'bg-green-600' : 'bg-muted-foreground/40'}`} />
                        Number (0-9)
                      </div>
                      <div className={`text-[11px] flex items-center gap-1.5 ${strengthCriteria[4] ? 'text-green-600' : 'text-muted-foreground'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${strengthCriteria[4] ? 'bg-green-600' : 'bg-muted-foreground/40'}`} />
                        Special character
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {signupError && (
                <p className="text-[12px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {signupError}
                </p>
              )}

              {/* Terms & Conditions */}
              <p className="text-[12px] text-muted-foreground text-center leading-[16px]">
                By continuing, you agree to our{' '}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>{' '}
                and that you have read and understood our{' '}
                <a href="#" className="underline text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>

              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={handleCreateAccount}
              >
                Create Account
              </Button>
            </>
          )}

          {step === 'account_created' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
              {/* Description */}
              <p className="text-[14px] text-muted-foreground">
                We've sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it below to verify your account.
              </p>

              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className="h-12 w-12 rounded-xl text-lg border-[#8c8c92] bg-background" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Verify Button */}
              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={async () => {
                  setIsVerifyingEmail(true);
                  // Simulate data processing latency
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  if (onContinueToVerification) {
                    onContinueToVerification();
                  }
                  setIsVerifyingEmail(false);
                }}
                disabled={otpCode.length < 6 || isVerifyingEmail}
              >
                {isVerifyingEmail ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Email'
                )}
              </Button>

              {/* Resend Code */}
              <div className="flex flex-col items-center gap-3">
                <button 
                  className={`text-[14px] font-medium hover:underline ${resendCooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground'}`}
                  onClick={() => {
                    if (resendCooldown === 0) {
                      setResendCooldown(60);
                      setShowResendToast(true);
                      setTimeout(() => setShowResendToast(false), 3000);
                    }
                  }}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                </button>
                
                <button 
                  className="text-[14px] text-foreground hover:underline"
                  onClick={() => {
                    if (onRestart) {
                      onRestart();
                    }
                  }}
                >
                  Back to Signup
                </button>
              </div>
            </div>
          )}

          {step === 'onboarding' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4">
                <p className="text-[14px] text-muted-foreground mb-1">
                   These details help us personalize your experience. You can skip this step if you prefer.
                </p>

                {/* Intent */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-medium text-muted-foreground">What are you looking for?</label>
                  <div className="grid grid-cols-3 gap-3">
                     {[
                       { id: 'job', label: 'Job', icon: 'briefcase' },
                       { id: 'placement', label: 'Clinical Placement', icon: 'hospital' },
                       { id: 'both', label: 'Both', icon: 'star' }
                     ].map((item) => (
                        <button
                           key={item.id}
                           onClick={() => setOnboardingData({...onboardingData, intent: item.id})}
                           className={cn(
                             "flex flex-col items-center justify-center p-3 gap-2 rounded-xl border transition-all h-[80px]",
                             onboardingData.intent === item.id 
                               ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                               : "border-[#8c8c92] bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                           )}
                        >
                           <FontAwesomeIcon name={item.icon as any} className="text-xl mb-1" />
                           <span className="text-[12px] font-medium leading-tight text-center">{item.label}</span>
                        </button>
                     ))}
                  </div>
                </div>

                {/* Graduation Year and Month */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-muted-foreground">Expected Graduation</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Month Selector */}
                    <Select 
                      value={onboardingData.gradMonth} 
                      onValueChange={(value) => setOnboardingData({ ...onboardingData, gradMonth: value })}
                    >
                      <SelectTrigger className="h-[48px] rounded-xl border-[#8c8c92] bg-background text-foreground px-3">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="february">February</SelectItem>
                        <SelectItem value="march">March</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="may">May</SelectItem>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="august">August</SelectItem>
                        <SelectItem value="september">September</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                        <SelectItem value="november">November</SelectItem>
                        <SelectItem value="december">December</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Year Selector */}
                    <Popover open={yearOpen} onOpenChange={setYearOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={yearOpen}
                          className="w-full h-[48px] justify-between rounded-xl border-[#8c8c92] bg-background text-foreground hover:bg-background hover:text-foreground px-3 font-normal border"
                        >
                          {onboardingData.gradYear
                            ? graduationYears.find((year) => year.value === onboardingData.gradYear)?.label
                            : "Year"}
                          <FontAwesomeIcon name="chevronDown" className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[180px] p-0">
                        <Command>
                          <CommandInput placeholder="Search year..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No year found.</CommandEmpty>
                            <CommandGroup>
                              {graduationYears.map((year) => (
                                <CommandItem
                                  key={year.value}
                                  value={year.value}
                                  onSelect={(currentValue) => {
                                    setOnboardingData({ ...onboardingData, gradYear: currentValue === onboardingData.gradYear ? "" : currentValue });
                                    setYearOpen(false);
                                  }}
                                >
                                  {year.label}
                                  <FontAwesomeIcon 
                                    name="check" 
                                    className={cn(
                                      "ml-auto text-primary",
                                      onboardingData.gradYear === year.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                 {/* Heard From */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-muted-foreground">Where did you hear about us?</label>
                   <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={sourceOpen}
                          className="w-full h-[48px] justify-between rounded-xl border-[#8c8c92] bg-background text-foreground hover:bg-background hover:text-foreground px-3 font-normal border"
                        >
                          {onboardingData.heardFrom
                            ? sources.find((source) => source.value === onboardingData.heardFrom)?.label
                            : "Select source"}
                          <FontAwesomeIcon name="chevronDown" className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0">
                        <Command>
                          <CommandInput placeholder="Search source..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No source found.</CommandEmpty>
                            <CommandGroup>
                              {sources.map((source) => (
                                <CommandItem
                                  key={source.value}
                                  value={source.value}
                                  onSelect={(currentValue) => {
                                    setOnboardingData({ ...onboardingData, heardFrom: currentValue === onboardingData.heardFrom ? "" : currentValue });
                                    setSourceOpen(false);
                                  }}
                                >
                                  {source.label}
                                  <FontAwesomeIcon 
                                    name="check" 
                                    className={cn(
                                      "ml-auto text-primary",
                                      onboardingData.heardFrom === source.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                <div className="flex flex-col items-center gap-4 mt-2">
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                    onClick={handleOnboardingSubmit}
                  >
                    Continue
                  </Button>
                  
                  <button 
                    className="text-[14px] font-medium text-muted-foreground hover:text-foreground underline"
                    onClick={handleOnboardingSubmit}
                  >
                    Skip
                  </button>
                </div>
            </div>
          )}

          {step === 'role_selection' && (
            <div className="flex flex-col gap-3">
               <p className="text-[14px] text-muted-foreground mb-2">
                 We found multiple profiles associated with <strong>{email}</strong>. Please select one to continue.
               </p>
               
               <div className="grid grid-cols-2 gap-4">
                 {roleCards.map((role) => (
                   <motion.button 
                    key={role.id}
                    className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all bg-card gap-4 group"
                    onClick={() => handleRoleSelect(role)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                   >
                     <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 shadow-inner">
                       <img 
                        src={role.image} 
                        alt={role.label} 
                        className="w-full h-full object-cover object-top" 
                       />
                     </div>
                     <div className="flex flex-col gap-1 text-center">
                       <span className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors">
                         {role.label}
                       </span>
                     </div>
                   </motion.button>
                 ))}
               </div>

                <button 
                  onClick={onBack}
                  className="mt-6 text-[14px] text-muted-foreground hover:text-foreground underline text-center w-full"
                >
                  Back to Sign In
                </button>
            </div>
          )}

          {step === 'password' && (
            <>
              {/* Email and Role Display */}
              <div className="relative w-full flex flex-col gap-3">
                
                {/* Trusted Device Indicator */}
                {isDeviceTrusted && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <FontAwesomeIcon name="shieldCheck" className="text-green-600 text-lg shrink-0" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-green-900">
                        Trusted Device
                      </p>
                      <p className="text-[12px] text-green-700">
                        2FA will be skipped on this device
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        forgetCurrentDevice(email);
                      }}
                      className="text-[12px] text-green-700 hover:text-green-900 underline shrink-0"
                      title="Remove this device from trusted devices"
                    >
                      Forget
                    </button>
                  </div>
                )}
                
                {/* Selected Role Display */}
                {selectedRole && (
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/40 animate-in fade-in slide-in-from-top-2">
                    <div className="w-6 h-6 shrink-0 rounded overflow-hidden bg-white border border-gray-100">
                      <img 
                        src={selectedRole.image} 
                        alt={selectedRole.label} 
                        className="w-full h-full object-cover object-top" 
                      />
                    </div>
                    <span className="text-[13px] font-medium text-muted-foreground">
                      Signing in as <span className="text-foreground font-semibold">{selectedRole.label}</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon name="envelope" className="text-base text-muted-foreground shrink-0" />
                    <span className="text-foreground text-base leading-none">
                      {email}
                    </span>
                  </div>
                  <button 
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded text-[14px] font-medium text-foreground"
                  >
                    <FontAwesomeIcon name="refresh" className="text-[14px] text-muted-foreground shrink-0" />
                    <span className="leading-none">Change</span>
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="relative w-full">
                 <div className="relative w-full">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
                    <FontAwesomeIcon name="lock" className="text-base text-muted-foreground" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Clear error when user starts typing
                      if (loginError) setLoginError(null);
                    }}
                    className={`${inputClasses} pr-10 ${loginError ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="current-password"
                    aria-invalid={!!loginError}
                    aria-describedby={loginError ? "password-error" : undefined}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:text-foreground text-muted-foreground"
                  >
                    {showPassword ? <FontAwesomeIcon name="eyeSlash" className="text-base" /> : <FontAwesomeIcon name="eye" className="text-base" />}
                  </button>
                </div>
                
                {/* Progressive Error Messages - Below Password Field */}
                {loginError && (
                  <p 
                    id="password-error" 
                    className="text-[12px] text-destructive font-medium flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-300"
                    role="alert"
                  >
                    <FontAwesomeIcon name="circleExclamation" className="text-sm" />
                    {loginAttempts < 3 ? 'Incorrect password' : 'Multiple failed password attempts. Try resetting your password.'}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <Button 
                className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                variant="primary"
                onClick={handleSignInAttempt}
              >
                Sign in
              </Button>

              {/* Forgot Password - Progressive styling */}
              <div className="w-full flex items-center gap-2">
                <button
                  onClick={onForgotPassword}
                  className={cn(
                    "text-[14px] hover:underline transition-all",
                    loginAttempts >= 3 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground"
                  )}
                >
                  Forgot password?
                </button>
                {loginAttempts >= 3 && (
                  <span className="text-[13px] text-muted-foreground">
                    • Need help?
                  </span>
                )}
              </div>
            </>
          )}
          
          {step === 'two_factor_auth' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
              {twoFactorMethod === 'phone' ? (
                <>
                  {/* Unified OTP Input with Phone Number */}
                  <div className="flex flex-col gap-5">
                    <p className="text-[14px] text-muted-foreground">
                      Enter the 6-digit verification code sent to <span className="font-medium text-foreground">🇺🇸 +1 (•••) •••-4567</span>
                    </p>
                    
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot 
                              key={index}
                              index={index} 
                              className="h-12 w-12 rounded-xl text-lg border-[#8c8c92] bg-background" 
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  {/* Remember Device Checkbox */}
                  <div className="flex items-start gap-3 px-1">
                    <input
                      type="checkbox"
                      id="remember-device-phone"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="mt-0.5 h-[18px] w-[18px] rounded border-2 border-[#D0D0D5] checked:bg-[#3F51B5] checked:border-[#3F51B5] focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-0 cursor-pointer appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[12px] checked:after:left-[2px] checked:after:top-[-2px] checked:after:font-bold"
                      style={{ accentColor: '#3F51B5' }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="remember-device-phone" 
                        className="text-[14px] text-foreground cursor-pointer select-none flex items-center gap-2"
                      >
                        Remember this device for 30 days
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowRememberDeviceInfo(!showRememberDeviceInfo);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Information about remembering device"
                        >
                          <FontAwesomeIcon name="circleInfo" className="text-sm" />
                        </button>
                      </label>
                      {showRememberDeviceInfo && (
                        <p className="text-[12px] text-muted-foreground mt-1 animate-in fade-in slide-in-from-top-2">
                          You won't need to verify your identity on this device for 30 days. Only use on trusted devices.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                    onClick={() => {
                      if (rememberDevice) {
                        trustCurrentDevice(email);
                      }
                      // Set the product selection now that 2FA is successful
                      if (pendingProductSelection && onProductSelected) {
                        onProductSelected(pendingProductSelection);
                      }
                      onSignIn();
                    }}
                    disabled={twoFactorCode.length < 6}
                  >
                    Verify & Continue
                  </Button>

                  {/* Resend Code */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      className={`text-[14px] font-medium hover:underline ${twoFactorResendCooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground'}`}
                      onClick={() => {
                        if (twoFactorResendCooldown === 0) {
                          // Reset to method-specific cooldown: 30s for phone, 60s for email
                          const cooldownTime = twoFactorMethod === 'phone' ? 30 : 60;
                          setTwoFactorResendCooldown(cooldownTime);
                          setShowTwoFactorToast(true);
                          setTimeout(() => setShowTwoFactorToast(false), 3000);
                        }
                      }}
                      disabled={twoFactorResendCooldown > 0}
                    >
                      {twoFactorResendCooldown > 0 ? `Resend Code (${twoFactorResendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>



                  {/* Bottom Actions */}
                  <div className="w-full flex justify-center items-center gap-2 pt-2">
                    <button
                      onClick={() => setTwoFactorMethod('email')}
                      className="text-[14px] text-foreground/70 hover:text-foreground hover:underline transition-all"
                    >
                      Use email verification instead
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button 
                      onClick={onRestart}
                      className="text-[14px] text-foreground/70 hover:text-foreground hover:underline transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Input for Email */}
                  <div className="flex flex-col gap-5">
                    <p className="text-[14px] text-muted-foreground">
                      We've sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>.
                    </p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot 
                              key={index}
                              index={index} 
                              className="h-12 w-12 rounded-xl text-lg border-[#8c8c92] bg-background" 
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  {/* Remember Device Checkbox */}
                  <div className="flex items-start gap-3 px-1">
                    <input
                      type="checkbox"
                      id="remember-device-email"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="mt-0.5 h-[18px] w-[18px] rounded border-2 border-[#D0D0D5] checked:bg-[#3F51B5] checked:border-[#3F51B5] focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-0 cursor-pointer appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[12px] checked:after:left-[2px] checked:after:top-[-2px] checked:after:font-bold"
                      style={{ accentColor: '#3F51B5' }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="remember-device-email" 
                        className="text-[14px] text-foreground cursor-pointer select-none flex items-center gap-2"
                      >
                        Remember this device for 30 days
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowRememberDeviceInfo(!showRememberDeviceInfo);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Information about remembering device"
                        >
                          <FontAwesomeIcon name="circleInfo" className="text-sm" />
                        </button>
                      </label>
                      {showRememberDeviceInfo && (
                        <p className="text-[12px] text-muted-foreground mt-1 animate-in fade-in slide-in-from-top-2">
                          You won't need to verify your identity on this device for 30 days. Only use on trusted devices.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                    onClick={() => {
                      if (rememberDevice) {
                        trustCurrentDevice(email);
                      }
                      // Set the product selection now that 2FA is successful
                      if (pendingProductSelection && onProductSelected) {
                        onProductSelected(pendingProductSelection);
                      }
                      onSignIn();
                    }}
                    disabled={twoFactorCode.length < 6}
                  >
                    Verify & Continue
                  </Button>

                  {/* Resend Code */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      className={`text-[14px] font-medium hover:underline ${twoFactorResendCooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground'}`}
                      onClick={() => {
                        if (twoFactorResendCooldown === 0) {
                          // Reset to method-specific cooldown: 30s for phone, 60s for email
                          const cooldownTime = twoFactorMethod === 'phone' ? 30 : 60;
                          setTwoFactorResendCooldown(cooldownTime);
                          setShowTwoFactorToast(true);
                          setTimeout(() => setShowTwoFactorToast(false), 3000);
                        }
                      }}
                      disabled={twoFactorResendCooldown > 0}
                    >
                      {twoFactorResendCooldown > 0 ? `Resend Code (${twoFactorResendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>

                  {/* Bottom Actions */}
                  <div className="w-full flex justify-center items-center gap-2 pt-2">
                    <button
                      onClick={() => setTwoFactorMethod('phone')}
                      className="text-[14px] text-foreground/70 hover:text-foreground hover:underline transition-all"
                    >
                      Use phone number instead
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button 
                      onClick={onBack}
                      className="text-[14px] text-foreground/70 hover:text-foreground hover:underline transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {showTwoFactorToast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm shadow-lg animate-in fade-in slide-in-from-top-2">
                  Code sent successfully!
                </div>
              )}
            </div>
          )}
          
          {step === 'forgot_password' && (
            <>
                {!resetEmailSent ? (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
                        <p className="text-[14px] text-muted-foreground">
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>
                        
                        <div className="w-full flex flex-col gap-2">
                           <div className="relative w-full">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
                              </div>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                value={resetEmail}
                                onChange={(e) => {
                                  setResetEmail(e.target.value);
                                  if (resetEmailError) setResetEmailError(null);
                                }}
                                className={`${inputClasses} ${resetEmailError ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                                autoFocus
                                autoComplete="off"
                              />
                              {resetEmailError && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
                                </div>
                              )}
                            </div>
                            {resetEmailError && (
                            <p className="text-[12px] text-red-500 font-medium">{resetEmailError}</p>
                            )}
                        </div>

                        <Button 
                            className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                            variant="primary"
                            onClick={handleSendResetLink}
                        >
                            Send Reset Link
                        </Button>
                        
                        <button 
                            onClick={onBack}
                            className="text-[14px] text-foreground/70 hover:text-foreground hover:underline text-center w-full"
                        >
                            Back to Sign In
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 items-center text-center animate-in fade-in zoom-in duration-300 mt-4">
                        {/* Icon and Header are handled in the main structure */}
                        <p className="text-[14px] text-muted-foreground max-w-xs">
                            We've sent a password reset link to <strong className="text-foreground">{resetEmail}</strong>. Please check your inbox.
                        </p>

                         <div className="h-4"></div>

                         <Button 
                            className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                            variant="outline"
                            onClick={onBack}
                        >
                            Back to Sign In
                        </Button>
                         <button 
                            onClick={() => setResetEmailSent(false)}
                            className="text-[14px] text-muted-foreground hover:text-foreground underline text-center w-full mt-2"
                        >
                            Didn't receive email? Resend
                        </button>
                    </div>
                )}
            </>
          )}
          
          {step === 'sso_redirect' && (
            <SSORedirect 
              email={email}
              ssoProvider={ssoProvider}
              onBack={onBack}
              onSSOComplete={onSSOComplete}
            />
          )}

          {step === 'product_selection' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
              {/* Email Display */}
              <div className="relative w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon name="envelope" className="text-xl text-muted-foreground shrink-0" />
                  <span className="text-foreground text-[18px]">
                    {email}
                  </span>
                </div>
                <button 
                  onClick={onBack}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded text-[14px] font-medium text-foreground"
                >
                  <FontAwesomeIcon name="refresh" className="text-sm text-muted-foreground shrink-0" />
                  <span>Change</span>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Special case for exxatone@exxat.com: Show only Exxat One card with inline persona selection */}
                {email.toLowerCase().trim() === 'exxatone@exxat.com' && (
                  <>
                    {/* Exxat One Card with Persona Selection */}
                    <div className="flex flex-col gap-4 p-6 rounded-lg bg-white border border-gray-200 transition-all">
                      {/* Exxat One Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatOneLogo />
                        </div>
                      </div>

                      {/* Persona Selection */}
                      <div className="flex flex-col gap-3">
                        <p className="text-[14px] text-muted-foreground leading-relaxed -ml-[2px]">
                          Select how you'd like to continue
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Student Persona */}
                          <motion.button
                            onClick={() => {
                              setSelectedPersona('student');
                              console.log('Selected Student persona for Exxat One');
                              setPendingProductSelection('one');
                              onNext('password');
                            }}
                            className="w-full flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-all bg-white gap-4 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-32 h-32 shrink-0 rounded-full bg-[#FFF4E6] flex items-center justify-center">
                              <img 
                                src={studentImage} 
                                alt="Student" 
                                className="w-full h-full object-cover object-top rounded-full" 
                              />
                            </div>
                            <div className="flex flex-col gap-3 items-center w-full">
                              <span className="text-[20px] font-semibold text-foreground leading-none">
                                As student
                              </span>
                              <div className="px-6 py-2.5 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center gap-2 transition-all">
                                <span className="text-[15px] text-[#3F51B5] group-hover:text-white font-semibold transition-colors">Continue</span>
                                <FontAwesomeIcon name="arrowRight" className="text-[15px] text-[#3F51B5] group-hover:text-white transition-colors" />
                              </div>
                            </div>
                          </motion.button>

                          {/* School Persona */}
                          <motion.button
                            onClick={() => {
                              setSelectedPersona('school');
                              console.log('Selected School persona for Exxat One');
                              setPendingProductSelection('one');
                              onNext('password');
                            }}
                            className="w-full flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-all bg-white gap-4 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-32 h-32 shrink-0 rounded-full bg-[#FFF4E6] flex items-center justify-center">
                              <img 
                                src={employerImage} 
                                alt="School" 
                                className="w-full h-full object-cover object-top rounded-full" 
                              />
                            </div>
                            <div className="flex flex-col gap-3 items-center w-full">
                              <span className="text-[20px] font-semibold text-foreground leading-none">
                                As school
                              </span>
                              <div className="px-6 py-2.5 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center gap-2 transition-all">
                                <span className="text-[15px] text-[#3F51B5] group-hover:text-white font-semibold transition-colors">Continue</span>
                                <FontAwesomeIcon name="arrowRight" className="text-[15px] text-[#3F51B5] group-hover:text-white transition-colors" />
                              </div>
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Special case for all@exxat.com: Show Prism card + Exxat One card with inline persona selection */}
                {email.toLowerCase().trim() === 'all@exxat.com' && (
                  <>
                    {/* Exxat Prism Card */}
                    <button
                      onClick={() => {
                        console.log('Selected Exxat Prism');
                        setPendingProductSelection('prism');
                        onNext('password');
                      }}
                      className="group relative flex items-center gap-4 p-6 rounded-lg bg-white border border-gray-200 hover:bg-[#F7F5FF] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatPrismLogo />
                        </div>
                      </div>
                      <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                        <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                        <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                      </span>
                    </button>

                    {/* Exxat One Card with Persona Selection */}
                    <div className="flex flex-col gap-4 p-6 rounded-lg bg-white border border-gray-200 transition-all">
                      {/* Header */}
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatOneLogo />
                        </div>
                      </div>

                      {/* Persona Selection */}
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Student Persona */}
                          <motion.button
                            onClick={() => {
                              setSelectedPersona('student');
                              console.log('Selected Student persona for Exxat One');
                              setPendingProductSelection('one');
                              onNext('password');
                            }}
                            className="w-full flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-[#FFF4F9] transition-all bg-white gap-3 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 shadow-inner">
                              <img 
                                src={studentImage} 
                                alt="Student" 
                                className="w-full h-full object-cover object-top" 
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-base font-semibold text-foreground group-hover:text-[#3F51B5] transition-colors leading-none">
                                As student
                              </span>
                            </div>
                            <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                              <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                              <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                            </span>
                          </motion.button>

                          {/* School Persona */}
                          <motion.button
                            onClick={() => {
                              setSelectedPersona('school');
                              console.log('Selected School persona for Exxat One');
                              setPendingProductSelection('one');
                              onNext('password');
                            }}
                            className="w-full flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-[#FFF4F9] transition-all bg-white gap-3 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 shadow-inner">
                              <img 
                                src={employerImage} 
                                alt="School" 
                                className="w-full h-full object-cover object-top" 
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                              <span className="text-base font-semibold text-foreground group-hover:text-[#3F51B5] transition-colors leading-none">
                                As school
                              </span>
                            </div>
                            <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                              <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                              <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Special case for ssoone@exxat.com: Show Prism (SSO) + Exxat One (Password) */}
                {email.toLowerCase().trim() === 'ssoone@exxat.com' && (
                  <>
                    {/* Exxat Prism Card - SSO Redirect */}
                    <button
                      onClick={() => {
                        console.log('Selected Exxat Prism - Redirecting to SSO');
                        setPendingProductSelection('prism');
                        // Set SSO provider first
                        setSSOProvider('exxat');
                        // Small delay to ensure state updates, then trigger SSO redirect
                        setTimeout(() => {
                          if (onSSORedirect) {
                            onSSORedirect('exxat');
                          }
                        }, 100);
                      }}
                      className="group relative flex items-center gap-4 p-6 rounded-lg bg-white border border-gray-200 hover:bg-[#F7F5FF] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatPrismLogo />
                        </div>
                      </div>
                      <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                        <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                        <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                      </span>
                    </button>

                    {/* Exxat One Card - Password Auth */}
                    <button
                      onClick={() => {
                        console.log('Selected Exxat One - Going to password');
                        setPendingProductSelection('one');
                        onNext('password');
                      }}
                      className="group relative flex items-center gap-4 p-6 rounded-lg bg-white border border-gray-200 hover:bg-[#FFF4F9] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatOneLogo />
                        </div>
                      </div>
                      <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                        <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                        <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                      </span>
                    </button>
                  </>
                )}

                {/* Default case: Show Exxat One and Prism cards for other @exxat.com emails */}
                {(email.endsWith('@exxat.com') && 
                  email.toLowerCase().trim() !== 'all@exxat.com' && 
                  email.toLowerCase().trim() !== 'exxatone@exxat.com' && 
                  email.toLowerCase().trim() !== 'ssoone@exxat.com' && 
                  email.toLowerCase().trim() !== 'one@exxat.com' && 
                  email.toLowerCase().trim() !== 'prism@exxat.com') && (
                  <>
                    {/* Exxat Prism Card */}
                    <button
                      onClick={() => {
                        console.log('Selected Exxat Prism');
                        setPendingProductSelection('prism');
                        onNext('password');
                      }}
                      className="group relative flex items-center gap-4 p-6 rounded-lg bg-white border border-gray-200 hover:bg-[#F7F5FF] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatPrismLogo />
                        </div>
                      </div>
                      <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                        <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                        <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                      </span>
                    </button>

                    {/* Exxat One - Student Card */}
                    <button
                      onClick={() => {
                        console.log('Selected Exxat One');
                        setPendingProductSelection('one');
                        onNext('password');
                      }}
                      className="group relative flex items-center gap-4 p-6 rounded-lg bg-white border border-gray-200 hover:bg-[#FFF4F9] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col gap-3 text-left">
                        <div className="w-[144px] h-[32px] -ml-2">
                          <ExxatOneLogo />
                        </div>
                      </div>
                      <span className="px-4 h-8 rounded-full bg-[#E8EAF6] group-hover:bg-[#3F51B5] flex items-center justify-between gap-2 transition-all flex-shrink-0">
                        <span className="text-[13px] text-[#3F51B5] group-hover:text-white font-medium transition-colors">Continue</span>
                        <FontAwesomeIcon name="arrowRight" className="text-[14px] text-[#3F51B5] group-hover:text-white transition-colors" aria-hidden="true" />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          
          {step === 'forgot_password' && (
               <div className="w-full h-4"></div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-8 right-8 flex justify-center items-center">
        <div className="w-full max-w-[480px]">
          <Footer />
        </div>
      </div>
      </>
      )}
    </motion.div>
  );
};