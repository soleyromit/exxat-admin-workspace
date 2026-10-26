"use client"

import * as React from "react"
import { AdminHome } from "@/components/v2/admin/admin-home"
import { StudentHome } from "@/components/v2/student/student-home"
import type { RoleId } from "@/lib/v2/types"

/** Admin has a Dashboard and student has a Home; every other role lands on its first nav row (see the role page). */
export function RoleHome({ role }: { role: RoleId }) {
  return role === "student" ? <StudentHome /> : <AdminHome />
}
