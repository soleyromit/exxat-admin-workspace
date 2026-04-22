import { ssoProviderImage as image_fe2734da397730a7eb1a808b20f1fc666320eceb } from "../assets/images";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { Button } from "./ui/button";

interface SSORedirectProps {
  email: string;
  ssoProvider: string | null;
  onBack: () => void;
  onSSOComplete?: () => void;
}

export const SSORedirect = ({ email, ssoProvider, onBack, onSSOComplete }: SSORedirectProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && onSSOComplete) {
      // After 5 seconds, trigger completion
      onSSOComplete();
    }
  }, [countdown, onSSOComplete]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
      {/* Email Display */}
      <div className="relative w-full flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 overflow-hidden" role="status" aria-live="polite" aria-label="Loading authentication details">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={image_fe2734da397730a7eb1a808b20f1fc666320eceb} 
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-[13px] font-medium text-blue-900">
            {email}
          </span>
        </div>
        {/* Semantic loader at bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-200 overflow-hidden rounded-b-lg" style={{ margin: '0 0 0 0' }} aria-hidden="true">
          <div 
            className="h-full bg-blue-600" 
            style={{ 
              width: '40%',
              animation: 'ssoLoading 1.5s ease-in-out infinite'
            }} 
          />
        </div>
        <style>{`
          @keyframes ssoLoading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(250%); }
            100% { transform: translateX(-100%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .absolute.bottom-0 > div {
              animation: none !important;
              width: 100% !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};