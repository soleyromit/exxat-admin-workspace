// Reports page mock data
// Extracted from reports-page.tsx to centralize mock data

import {
  Users,
  Building,
  Calendar,
  Award,
  type LucideIcon,
} from "lucide-react"

export interface ReportCard {
  title: string
  value: string
  change: string
  trend: string
  icon: LucideIcon
  description: string
}

export const reportCards: ReportCard[] = [
  {
    title: "Total Active Students",
    value: "2,847",
    change: "+12.3%",
    trend: "up",
    icon: Users,
    description: "Students currently enrolled in placement programs",
  },
  {
    title: "Partner Institutions",
    value: "156",
    change: "+8.7%",
    trend: "up",
    icon: Building,
    description: "Healthcare facilities and academic institutions",
  },
  {
    title: "Placements This Month",
    value: "423",
    change: "-3.2%",
    trend: "down",
    icon: Calendar,
    description: "Successfully completed placement matches",
  },
  {
    title: "Success Rate",
    value: "94.2%",
    change: "+2.1%",
    trend: "up",
    icon: Award,
    description: "Percentage of successful placements",
  },
]

export const recentReports = [
  { name: "Monthly Placement Report", date: "12/15/2024", type: "Placements", status: "Ready" },
  { name: "Student Satisfaction Survey", date: "12/14/2024", type: "Survey", status: "Processing" },
  { name: "Partner Performance Analysis", date: "12/13/2024", type: "Analytics", status: "Ready" },
  { name: "Regional Demand Forecast", date: "12/12/2024", type: "Forecast", status: "Ready" },
  { name: "Quality Assurance Audit", date: "12/11/2024", type: "Audit", status: "Draft" },
]

export const quickStats = [
  { label: "Avg. Placement Time", value: "14 days", change: "-2 days" },
  { label: "Student Retention", value: "96.8%", change: "+1.2%" },
  { label: "Partner Satisfaction", value: "4.7/5", change: "+0.1" },
  { label: "Response Time", value: "2.3 hrs", change: "-0.5 hrs" },
]
