import React from "react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "motion/react";

interface AccordionAuthProps {
  email: string;
  onEmailChange: (email: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleNextWithValidation: () => void;
  handleEmailChange: (email: string) => void;
  setSignupCardType: (type: 'student' | 'school' | null) => void;
  inputClasses: string;
  emailError: string | null;
  emailValidationState: 'idle' | 'valid' | 'invalid';
  isValidatingEmail: boolean;
  expandedSection?: 'signin' | 'student' | 'school';
  setExpandedSection?: (section: 'signin' | 'student' | 'school') => void;
  shouldShimmerSignIn?: boolean;
}

export const AccordionAuth: React.FC<AccordionAuthProps> = ({
  email,
  onEmailChange,
  onKeyDown,
  handleNextWithValidation,
  handleEmailChange,
  setSignupCardType,
  inputClasses,
  emailError,
  emailValidationState,
  isValidatingEmail,
}) => {
  const [mode, setMode] = React.useState<'signin' | 'onboarding' | 'contact-sales'>('signin');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Handle continue with email (Sign in flow)
  const handleContinue = () => {
    setSignupCardType(null);
    handleNextWithValidation();
  };

  // Handle student signup - switch to onboarding mode
  const handleStudentSignup = () => {
    setMode('onboarding');
    setSignupCardType('student'); // Immediately set student mode
  };

  // Handle back to sign in
  const handleBackToSignIn = () => {
    setMode('signin');
    setFirstName('');
    setLastName('');
    setPassword('');
    setConfirmPassword('');
    setSignupCardType(null); // Reset signup card type when going back to signin
  };

  // Handle school/site contact - switch to contact-sales mode
  const handleSchoolContact = () => {
    setMode('contact-sales');
  };

  // Onboarding mode rendering
  if (mode === 'onboarding') {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.28px] text-foreground">
            Join Exxat One Network
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Enter your email to create your student account
          </p>
        </div>

        {/* Email Input */}
        <div className="w-full flex flex-col gap-2">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
              <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
            </div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={onKeyDown}
              className={`${inputClasses} ${
                emailError
                  ? 'border-red-500 focus-visible:ring-red-500/20'
                  : ''
              }`}
              autoFocus
              autoComplete="email"
            />
            {emailError ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              >
                <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
              </motion.div>
            ) : emailValidationState === 'valid' ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{
                  duration: 0.4,
                  times: [0, 0.6, 1],
                  ease: 'easeOut',
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              >
                <FontAwesomeIcon name="circleCheck" className="text-lg text-green-600" />
              </motion.div>
            ) : null}
          </div>
          {emailError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] text-red-500 font-medium"
            >
              {emailError}
            </motion.p>
          )}
        </div>

        {/* Continue Button */}
        <Button
          className="w-full h-[48px] rounded-xl text-[16px] font-medium"
          variant="primary"
          onClick={() => {
            setSignupCardType('student');
            handleNextWithValidation();
          }}
          disabled={isValidatingEmail}
        >
          {isValidatingEmail ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <FontAwesomeIcon name="spinner" className="text-lg" />
              </motion.span>
              Validating...
            </span>
          ) : (
            'Continue'
          )}
        </Button>

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

        {/* Gradient Separator */}
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 406 1">
              <line stroke="url(#paint0_linear_separator_onboarding)" x2="406" y1="0.5" y2="0.5" />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_separator_onboarding" x1="0" x2="406" y1="1.5" y2="1.5">
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="0.504808" stopColor="#E0E0E0" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Alternate CTAs */}
        <div className="flex flex-col gap-1 w-full">
          {/* Back to Sign In */}
          <button
            onClick={handleBackToSignIn}
            className="w-full flex items-center justify-between px-0 py-2 text-left group"
          >
            <span className="text-[14px] font-medium text-foreground">
              Already have an account?{' '}
              <span className="text-[#3F51B5] group-hover:underline transition-all">
                Sign in to Exxat
              </span>
            </span>
          </button>

          {/* School/Site CTA */}
          <button
            onClick={handleSchoolContact}
            className="w-full flex items-center justify-between px-0 py-2 text-left group"
          >
            <span className="text-[14px] font-medium text-foreground">
              New school or site?{' '}
              <span className="text-[#3F51B5] group-hover:underline transition-all">
                Contact Sales
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Contact Sales mode rendering
  if (mode === 'contact-sales') {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.28px] text-foreground">
            Contact Exxat Sales
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Enter your email to speak with our sales team
          </p>
        </div>

        {/* Email Input */}
        <div className="w-full flex flex-col gap-2">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
              <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
            </div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={onKeyDown}
              className={`${inputClasses} ${
                emailError
                  ? 'border-red-500 focus-visible:ring-red-500/20'
                  : ''
              }`}
              autoFocus
              autoComplete="email"
            />
            {emailError ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              >
                <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
              </motion.div>
            ) : emailValidationState === 'valid' ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{
                  duration: 0.4,
                  times: [0, 0.6, 1],
                  ease: 'easeOut',
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              >
                <FontAwesomeIcon name="circleCheck" className="text-lg text-green-600" />
              </motion.div>
            ) : null}
          </div>
          {emailError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] text-red-500 font-medium"
            >
              {emailError}
            </motion.p>
          )}
        </div>

        {/* Continue Button */}
        <Button
          className="w-full h-[48px] rounded-xl text-[16px] font-medium"
          variant="primary"
          onClick={() => {
            setSignupCardType('school');
            handleNextWithValidation();
          }}
          disabled={isValidatingEmail}
        >
          {isValidatingEmail ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <FontAwesomeIcon name="spinner" className="text-lg" />
              </motion.span>
              Validating...
            </span>
          ) : (
            'Continue'
          )}
        </Button>

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

        {/* Gradient Separator */}
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 406 1">
              <line stroke="url(#paint0_linear_separator_contact)" x2="406" y1="0.5" y2="0.5" />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_separator_contact" x1="0" x2="406" y1="1.5" y2="1.5">
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="0.504808" stopColor="#E0E0E0" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Alternate CTAs */}
        <div className="flex flex-col gap-1 w-full">
          {/* Back to Sign In */}
          <button
            onClick={handleBackToSignIn}
            className="w-full flex items-center justify-between px-0 py-2 text-left group"
          >
            <span className="text-[14px] font-medium text-foreground">
              Already have an account?{' '}
              <span className="text-[#3F51B5] group-hover:underline transition-all">
                Sign in to Exxat
              </span>
            </span>
          </button>

          {/* Student CTA */}
          <button
            onClick={handleStudentSignup}
            className="w-full flex items-center justify-between px-0 py-2 text-left group"
          >
            <span className="text-[14px] font-medium text-foreground">
              New student?{' '}
              <span className="text-[#3F51B5] group-hover:underline transition-all">
                Join Exxat One Network
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Sign-in mode rendering
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.28px] text-foreground">
          Access all your Exxat products
        </h2>
        <p className="text-[14px] text-muted-foreground">
          Enter your email to begin your access form
        </p>
      </div>

      {/* Email Input */}
      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
            <FontAwesomeIcon name="envelope" className="text-lg text-muted-foreground" />
          </div>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={`${inputClasses} ${
              emailError
                ? 'border-red-500 focus-visible:ring-red-500/20'
                : ''
            }`}
            autoFocus
            autoComplete="email"
          />
          {emailError ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
            >
              <FontAwesomeIcon name="circleExclamation" className="text-lg text-red-500" />
            </motion.div>
          ) : emailValidationState === 'valid' ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{
                duration: 0.4,
                times: [0, 0.6, 1],
                ease: 'easeOut',
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
            >
              <FontAwesomeIcon name="circleCheck" className="text-lg text-green-600" />
            </motion.div>
          ) : null}
        </div>
        {emailError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[12px] text-red-500 font-medium"
          >
            {emailError}
          </motion.p>
        )}
      </div>

      {/* Continue Button */}
      <Button
        className="w-full h-[48px] rounded-xl text-[16px] font-medium"
        variant="primary"
        onClick={handleContinue}
        disabled={isValidatingEmail}
      >
        {isValidatingEmail ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <FontAwesomeIcon name="spinner" className="text-lg" />
            </motion.span>
            Validating...
          </span>
        ) : (
          'Continue'
        )}
      </Button>

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

      {/* Gradient Separator */}
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 406 1">
            <line stroke="url(#paint0_linear_separator)" x2="406" y1="0.5" y2="0.5" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_separator" x1="0" x2="406" y1="1.5" y2="1.5">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="0.504808" stopColor="#E0E0E0" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Alternate CTAs */}
      <div className="flex flex-col gap-1 w-full">
        {/* Student CTA */}
        <button
          onClick={handleStudentSignup}
          className="w-full flex items-center justify-between px-0 py-2 text-left group"
        >
          <span className="text-[14px] font-medium text-foreground">
            New student?{' '}
            <span className="text-[#3F51B5] group-hover:underline transition-all">
              Join Exxat One Network
            </span>
          </span>
        </button>

        {/* School/Site CTA */}
        <button
          onClick={handleSchoolContact}
          className="w-full flex items-center justify-between px-0 py-2 text-left group"
        >
          <span className="text-[14px] font-medium text-foreground">
            New school or site?{' '}
            <span className="text-[#3F51B5] group-hover:underline transition-all">
              Contact Sales
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};