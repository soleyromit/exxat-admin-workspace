"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { AdminDashboardA } from "./admin-dashboard-a"
import { AdminDashboardB } from "./admin-dashboard-b"
import { AdminDashboardPipeline } from "./admin-dashboard-pipeline"
import { AdminDashboardD } from "./admin-dashboard-d"
import { AdminDashboardOps } from "./admin-dashboard-ops"
import { AdminDashboardF } from "./admin-dashboard-f"
import { DirectorDashboardA } from "./director-dashboard-a"
import { DirectorDashboardB } from "./director-dashboard-b"
import { DirectorDashboardC } from "./director-dashboard-c"

/**
 * The list behind a figure is shared by every variant of a dashboard. It used to live only in one variant (admin records
 * list in C, evaluator lists in E, the director worklist in C), so every figure link carried that variant's letter and a
 * click inside option set 1 or 2 jumped into another design. Now a figure links to the same dashboard with `?list=`, the URL
 * keeps the reviewer's variant, and whichever variant is showing renders the shared list.
 */
function AdminDrills({ Base }: { Base: React.ComponentType }) {
  const list = useSearchParams()?.get("list")
  if (list === "records") return <AdminDashboardPipeline />
  if (list === "holders" || list === "holder") return <AdminDashboardOps />
  return <Base />
}

function DirectorDrills({ Base }: { Base: React.ComponentType }) {
  const p = useSearchParams()
  if (p?.get("list") || p?.get("skill") || p?.get("status")) return <DirectorDashboardC />
  return <Base />
}

export const AdminDashboardAShared = () => <AdminDrills Base={AdminDashboardA} />
export const AdminDashboardBShared = () => <AdminDrills Base={AdminDashboardB} />
export const AdminDashboardCShared = () => <AdminDrills Base={AdminDashboardPipeline} />
export const AdminDashboardDShared = () => <AdminDrills Base={AdminDashboardD} />
export const AdminDashboardEShared = () => <AdminDrills Base={AdminDashboardOps} />
export const AdminDashboardFShared = () => <AdminDrills Base={AdminDashboardF} />
export const DirectorDashboardAShared = () => <DirectorDrills Base={DirectorDashboardA} />
export const DirectorDashboardBShared = () => <DirectorDrills Base={DirectorDashboardB} />
