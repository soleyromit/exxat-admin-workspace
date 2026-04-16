import { AssessmentsClient } from './assessments-client'

export default function AssessmentsPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center border-b border-[var(--border)] bg-[var(--background)] px-6">
        <span className="text-sm font-semibold text-[var(--foreground)]">Exam Management</span>
      </header>
      <AssessmentsClient />
    </div>
  )
}
