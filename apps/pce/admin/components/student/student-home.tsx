"use client"

/**
 * Where the pick-a-role flow lands a student.
 *
 * Deliberately thin. Exxat has no student product yet, so the honest thing to
 * show is the shape of one (identity, what is assigned, what is due) with real
 * empty states rather than invented rows. Every card here is the empty case on
 * purpose: a student with nothing assigned is the first state a real student
 * portal has to survive, and it is the one prototypes usually skip.
 *
 * It wears its own header rather than the workspace utility bar. A student holds
 * no product, so the switcher would name an app that is not theirs, search and
 * Ask Leo would reach records they cannot see, and the workspace promo strip
 * would sell them a licence their school already owns. `App.tsx` treats this
 * route as chromeless for that reason, which leaves the header here to carry the
 * only two things a student needs from the shell: who they are, and the way out.
 */

import { AuthBrandLockup } from "@/components/auth/auth-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignInFlowMenuItem } from "@/components/sign-in-flow-menu-item"
import { NAV_USER } from "@/lib/mock/navigation"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useLogOut } from "@/hooks/use-log-out"

const STUDENT_SECTIONS = [
  {
    title: "Placements",
    icon: "fa-light fa-hospital-user",
    empty: "No placements assigned yet. Your program will add them when scheduling opens.",
  },
  {
    title: "Requirements",
    icon: "fa-light fa-clipboard-check",
    empty: "Nothing to submit right now.",
  },
  {
    title: "Hours",
    icon: "fa-light fa-clock",
    empty: "No hours logged. Logging opens with your first placement.",
  },
] as const

function StudentHeader() {
  const logOut = useLogOut()
  const user = NAV_USER

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6 sm:px-8">
      <AuthBrandLockup />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Open your account menu, ${user.name}`}
            className="rounded-full"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.avatar} alt="" className="object-cover" aria-hidden="true" />
              <AvatarFallback aria-hidden="true">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-lg" align="end" sideOffset={4}>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* The way back to the other flows. Null outside a builder workspace,
              which is also the only place this page exists to be demonstrated. */}
          <SignInFlowMenuItem />
          <DropdownMenuItem onSelect={logOut}>
            <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export function StudentHome() {
  useDocumentTitle("Student home")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StudentHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
          <header>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Welcome, {NAV_USER.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing needs your attention today.
            </p>
          </header>

          <div className="flex flex-col gap-4">
            {STUDENT_SECTIONS.map(section => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <i className={`${section.icon} text-muted-foreground`} aria-hidden="true" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.empty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
