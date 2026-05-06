import { SidebarProvider, SidebarInset, TooltipProvider } from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { FacultySessionProvider } from '@/lib/faculty-session'
import { AssessmentReviewProvider } from '@/lib/assessment-review-store'
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
        <CommunicationPolicyProvider>
          <TooltipProvider>
            <SidebarProvider className="h-svh">
              <AppSidebar />
              <SidebarInset className="flex flex-col overflow-x-hidden" style={{ paddingBottom: 0 }}>
                <StandaloneLoginBanner />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </CommunicationPolicyProvider>
      </AssessmentReviewProvider>
    </FacultySessionProvider>
  )
}
