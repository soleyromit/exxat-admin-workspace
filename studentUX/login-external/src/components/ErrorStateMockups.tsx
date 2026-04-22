import React, { useState } from "react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { Button } from "./ui/button";

export const ErrorStateMockups = () => {
  const [activeTab, setActiveTab] = useState<'backend' | 'maintenance' | 'onboarding'>('backend');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Error State Mockups</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('backend')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'backend' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Backend Error
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'maintenance' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            System Maintenance
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'onboarding' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Onboarding Failed
          </button>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center min-h-[600px]">
          <div className="w-full max-w-[420px]">
            
            {/* Backend Error State */}
            {activeTab === 'backend' && (
              <div className="flex flex-col gap-6 items-center text-center animate-in fade-in slide-in-from-bottom-4">
                {/* Error Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="triangleExclamation" className="text-3xl text-red-600" />
                </div>

                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-[20px] font-bold text-foreground leading-[28px]">
                    Something went wrong
                  </h1>
                  <p className="text-[14px] text-muted-foreground">
                    We're having trouble connecting to our servers. This might be a temporary issue.
                  </p>
                </div>

                {/* Error Details (Expandable) */}
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon name="circleInfo" className="text-red-600 text-sm mt-0.5 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-medium text-red-900 mb-1">Error Details</p>
                      <p className="text-[12px] text-red-700 font-mono">
                        Error Code: ERR_BACKEND_500
                      </p>
                      <p className="text-[12px] text-red-700 mt-1">
                        Our team has been notified and is working on a fix.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                  >
                    <FontAwesomeIcon name="arrowsRotate" className="text-lg mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="outline"
                  >
                    Back to Sign In
                  </Button>
                </div>

                {/* Help Section */}
                <div className="w-full pt-4 border-t border-border">
                  <p className="text-[13px] text-muted-foreground mb-2">
                    Still having issues?
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <a href="#" className="text-[14px] text-primary hover:underline font-medium flex items-center gap-1.5">
                      <FontAwesomeIcon name="lifeRing" className="text-sm" />
                      Contact Support
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="#" className="text-[14px] text-primary hover:underline font-medium flex items-center gap-1.5">
                      <FontAwesomeIcon name="clockRotateLeft" className="text-sm" />
                      Check Status
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* System Maintenance State */}
            {activeTab === 'maintenance' && (
              <div className="flex flex-col gap-6 items-center text-center animate-in fade-in slide-in-from-bottom-4">
                {/* Maintenance Icon */}
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="screwdriverWrench" className="text-3xl text-amber-600" />
                </div>

                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-[20px] font-bold text-foreground leading-[28px]">
                    Scheduled Maintenance
                  </h1>
                  <p className="text-[14px] text-muted-foreground">
                    We're currently performing scheduled maintenance to improve your experience.
                  </p>
                </div>

                {/* Maintenance Timeline */}
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-amber-900">Started</span>
                      <span className="text-[13px] text-amber-700">Today, 2:00 AM EST</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-amber-900">Expected completion</span>
                      <span className="text-[13px] text-amber-700">Today, 6:00 AM EST</span>
                    </div>
                    <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-[12px] text-amber-700 text-center">
                      Approximately 65% complete
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon name="circleInfo" className="text-blue-600 text-sm mt-0.5 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-[13px] text-blue-900">
                        All services will be restored shortly. Thank you for your patience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                  >
                    <FontAwesomeIcon name="arrowsRotate" className="text-lg mr-2" />
                    Check Again
                  </Button>
                </div>

                {/* Updates Section */}
                <div className="w-full pt-4 border-t border-border">
                  <p className="text-[13px] text-muted-foreground mb-2">
                    Get notified when we're back
                  </p>
                  <a href="#" className="text-[14px] text-primary hover:underline font-medium flex items-center justify-center gap-1.5">
                    <FontAwesomeIcon name="bell" className="text-sm" />
                    Subscribe to Status Updates
                  </a>
                </div>
              </div>
            )}

            {/* Onboarding Failed State */}
            {activeTab === 'onboarding' && (
              <div className="flex flex-col gap-6 items-center text-center animate-in fade-in slide-in-from-bottom-4">
                {/* Error Icon */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="circleXmark" className="text-3xl text-orange-600" />
                </div>

                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-[20px] font-bold text-foreground leading-[28px]">
                    Unable to complete setup
                  </h1>
                  <p className="text-[14px] text-muted-foreground">
                    We encountered an issue while setting up your profile. Don't worry, your account is safe.
                  </p>
                </div>

                {/* What Happened */}
                <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon name="listCheck" className="text-orange-600 text-sm mt-0.5 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-medium text-orange-900 mb-2">What we saved:</p>
                      <ul className="space-y-1">
                        <li className="text-[12px] text-orange-700 flex items-center gap-2">
                          <FontAwesomeIcon name="check" className="text-green-600 text-xs" />
                          Account created successfully
                        </li>
                        <li className="text-[12px] text-orange-700 flex items-center gap-2">
                          <FontAwesomeIcon name="check" className="text-green-600 text-xs" />
                          Email verified
                        </li>
                        <li className="text-[12px] text-orange-700 flex items-center gap-2">
                          <FontAwesomeIcon name="xmark" className="text-orange-600 text-xs" />
                          Profile preferences not saved
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="primary"
                  >
                    <FontAwesomeIcon name="arrowsRotate" className="text-lg mr-2" />
                    Retry Profile Setup
                  </Button>
                  
                  <Button 
                    className="w-full h-[48px] rounded-xl text-[16px] font-medium" 
                    variant="outline"
                  >
                    Skip for Now
                  </Button>
                </div>

                {/* Help Text */}
                <div className="w-full pt-4 border-t border-border">
                  <p className="text-[13px] text-muted-foreground">
                    You can complete your profile setup anytime from your account settings.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Design Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FontAwesomeIcon name="lightbulb" className="text-blue-600" />
            Design Notes
          </h2>
          <div className="space-y-2 text-[14px] text-blue-900">
            {activeTab === 'backend' && (
              <>
                <p>• <strong>Backend Error:</strong> Shows when API calls fail (500, 502, 503 errors)</p>
                <p>• Includes error code for debugging and support tickets</p>
                <p>• Offers retry action and fallback to sign-in page</p>
                <p>• Provides quick access to support and status page</p>
              </>
            )}
            {activeTab === 'maintenance' && (
              <>
                <p>• <strong>Maintenance Mode:</strong> Displays during scheduled downtime</p>
                <p>• Shows progress bar and estimated completion time</p>
                <p>• Can be triggered via feature flag or admin panel</p>
                <p>• Offers status update subscription option</p>
              </>
            )}
            {activeTab === 'onboarding' && (
              <>
                <p>• <strong>Onboarding Failed:</strong> When profile setup fails after account creation</p>
                <p>• Shows what data was successfully saved vs. what failed</p>
                <p>• Allows user to retry or skip (can complete later)</p>
                <p>• Reassures user that their account is safe</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
