"use client"

/**
 * Leaving the app, from either profile menu (utility bar and sidebar rail).
 *
 * Both menus have to end a session identically, so the pair of steps lives here
 * rather than being retyped at each call site.
 */

import * as React from "react"
import { useNavigate } from "react-router"

import { signOut } from "@/lib/auth-session"
import { clearLoginSession } from "@/lib/login-session"

export function useLogOut(): () => void {
  const navigate = useNavigate()

  return React.useCallback(() => {
    signOut()
    // What the sign-in flow granted belongs to the session that ran it: the apps,
    // and what home was told to show. Keeping any of it would hand the next
    // visitor a narrowed workspace they never asked for, before they sign in.
    clearLoginSession()
    // `replace` so Back cannot return to a workspace page the session no longer
    // covers, which would show a signed-in shell to someone who just left.
    navigate("/login", { replace: true })
  }, [navigate])
}
