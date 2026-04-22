// Dashboard mock data - Home page sections
// Extracted from page components to centralize mock data

import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  Clock,
  FileWarning,
  UserX,
} from "lucide-react"

// ─── Alerts Section Data ────────────────────────────────────────────────────

export const alertsData = [
  {
    id: 1,
    icon: AlertCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    title: "15 Schedules Unconfirmed",
    description: "Schedules starting within 7 days need confirmation",
    action: "Review Now",
    urgency: "high" as const,
  },
  {
    id: 2,
    icon: Clock,
    iconColor: "text-chart-4",
    bgColor: "bg-chart-4/10",
    title: "23 Overdue Requests",
    description: "Requests pending approval for over 30 days",
    action: "View Requests",
    urgency: "medium" as const,
  },
  {
    id: 3,
    icon: FileWarning,
    iconColor: "text-chart-4",
    bgColor: "bg-chart-4/10",
    title: "95 Faculty Compliance Issues",
    description: "Faculty members with pending compliance items",
    action: "View Details",
    urgency: "medium" as const,
  },
  {
    id: 4,
    icon: UserX,
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted/50",
    title: "483 Pending First Login",
    description: "237 students and 246 faculty awaiting activation",
    action: "Send Reminder",
    urgency: "low" as const,
  },
]

// ─── Key Metrics Data ───────────────────────────────────────────────────────

export const metricsData = {
  pendingRequests: { current: 23, previous: 18, trend: "up" as const },
  confirmedPlacements: { current: 89, previous: 77, trend: "up" as const },
  pendingReviews: { current: 8, previous: 11, trend: "down" as const },
  availableSlots: { current: 156, previous: 132, trend: "up" as const },
  complianceRate: { current: 98, previous: 96, trend: "up" as const },
  newApplications: { current: 34, previous: 27, trend: "up" as const },
}

// ─── Pipeline Overview Data ─────────────────────────────────────────────────

export const pipelineData = [
  { name: "To Be Scheduled", value: 11, color: "var(--chart-1)" },
  { name: "Confirmed", value: 2, color: "var(--chart-2)" },
  { name: "Not Confirmed", value: 0, color: "var(--chart-4)" },
  { name: "Cancelled", value: 0, color: "var(--chart-5)" },
]

export const onboardingData = [
  { name: "Compliant", value: 745, color: "var(--chart-2)" },
  { name: "Pending Documents", value: 186, color: "var(--chart-4)" },
  { name: "Expired Credentials", value: 92, color: "var(--chart-5)" },
  { name: "Not Started", value: 211, color: "var(--muted)" },
]

// ─── Pending Items Data ─────────────────────────────────────────────────────

export const requestsAgeData = [
  { age: "<7 days", count: 142 },
  { age: "7-15 days", count: 98 },
  { age: "16-30 days", count: 123 },
  { age: ">30 days", count: 123 },
]

export const schedulesAgeData = [
  { age: "<7 days", count: 28 },
  { age: "7-15 days", count: 15 },
  { age: "16-30 days", count: 8 },
  { age: ">30 days", count: 5 },
]

// ─── Partner Performance Data ───────────────────────────────────────────────

export const partnerPerformanceData = [
  { name: "Mayo Clinic", placements: 45, responseRate: 92, satisfaction: 4.8 },
  { name: "Johns Hopkins", placements: 52, responseRate: 88, satisfaction: 4.7 },
  { name: "Cleveland Clinic", placements: 38, responseRate: 95, satisfaction: 4.9 },
  { name: "Mass General", placements: 41, responseRate: 85, satisfaction: 4.5 },
  { name: "Stanford Health", placements: 31, responseRate: 90, satisfaction: 4.6 },
  { name: "UCSF Medical", placements: 35, responseRate: 87, satisfaction: 4.4 },
]

export const responseTimeData = [
  { name: "Mayo Clinic", avgDays: 2.1 },
  { name: "Johns Hopkins", avgDays: 3.4 },
  { name: "Cleveland Clinic", avgDays: 1.8 },
  { name: "Mass General", avgDays: 4.2 },
  { name: "Stanford Health", avgDays: 2.9 },
  { name: "UCSF Medical", avgDays: 3.1 },
]

// ─── Map Locations Data ─────────────────────────────────────────────────────

export const mapLocations = [
  { id: 1, name: "Mayo Clinic", city: "Rochester, MN", lat: 44.0225, lng: -92.4699, count: 45, type: "hospital", isNew: false },
  { id: 2, name: "Cleveland Clinic", city: "Cleveland, OH", lat: 41.5034, lng: -81.6201, count: 38, type: "hospital", isNew: false },
  { id: 3, name: "Johns Hopkins", city: "Baltimore, MD", lat: 39.297, lng: -76.593, count: 52, type: "hospital", isNew: true },
  { id: 4, name: "Massachusetts General", city: "Boston, MA", lat: 42.3631, lng: -71.0686, count: 41, type: "hospital", isNew: false },
  { id: 5, name: "UCSF Medical Center", city: "San Francisco, CA", lat: 37.7625, lng: -122.4586, count: 35, type: "hospital", isNew: false },
  { id: 6, name: "UCLA Medical Center", city: "Los Angeles, CA", lat: 34.0655, lng: -118.4456, count: 29, type: "hospital", isNew: false },
  { id: 7, name: "Northwestern Memorial", city: "Chicago, IL", lat: 41.8958, lng: -87.6196, count: 33, type: "hospital", isNew: true },
  { id: 8, name: "Duke University Hospital", city: "Durham, NC", lat: 36.0103, lng: -78.9391, count: 27, type: "hospital", isNew: true },
  { id: 9, name: "Stanford Health Care", city: "Palo Alto, CA", lat: 37.4419, lng: -122.174, count: 31, type: "hospital", isNew: false },
  { id: 10, name: "Mount Sinai Hospital", city: "New York, NY", lat: 40.7903, lng: -73.9522, count: 44, type: "hospital", isNew: false },
  { id: 11, name: "Houston Methodist", city: "Houston, TX", lat: 29.7075, lng: -95.4019, count: 26, type: "hospital", isNew: true },
  { id: 12, name: "Cedars-Sinai", city: "Los Angeles, CA", lat: 34.0755, lng: -118.3773, count: 22, type: "hospital", isNew: false },
]

// Marketing alert data for the home page ticker
export interface MarketingAlert {
  icon: LucideIcon
  color: string
  message: string
  subtext: string
}

// Note: marketingAlerts uses icons that are imported in the component (Building2, Calendar, TrendingUp, Users, CheckCircle2)
// They remain defined in the component since they reference component-level icon imports
