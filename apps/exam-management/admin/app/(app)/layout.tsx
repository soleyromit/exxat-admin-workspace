import { SidebarProvider, SidebarInset, TooltipProvider, Toaster } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { FacultySessionProvider } from '@/lib/faculty-session'
import { AssessmentReviewProvider } from '@/lib/assessment-review-store'
import { AssessmentDraftProvider } from '@/lib/assessment-draft-store'
import { StudentAccommodationProvider } from '@/lib/student-accommodation-store'
import { CommunicationPolicyProvider } from '@/lib/communication-policy-store'
import { StandaloneLoginBanner } from '@/components/standalone-login-banner'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FacultySessionProvider>
      <AssessmentReviewProvider>
        <AssessmentDraftProvider>
          <StudentAccommodationProvider>
            <CommunicationPolicyProvider>
              <TooltipProvider>
                <SidebarProvider className="h-svh">
                  <AppSidebar />
                  <SidebarInset className="flex flex-col overflow-x-hidden" style={{ paddingBottom: 0 }}>
                    <StandaloneLoginBanner />
                    {children}
                  </SidebarInset>
                </SidebarProvider>
                <Toaster position="bottom-center" />
              </TooltipProvider>
            </CommunicationPolicyProvider>
          </StudentAccommodationProvider>
        </AssessmentDraftProvider>
      </AssessmentReviewProvider>
    </FacultySessionProvider>
  )
}
