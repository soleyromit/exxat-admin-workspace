"use client"

/**
 * NewPlacementForm — 5-step multi-step placement creation form
 *
 * Steps:
 *   1. Student Information   — personal & academic details
 *   2. Site & Program        — where and what rotation
 *   3. Schedule              — dates (via picker), hours, shift
 *   4. Supervisor & Compliance — supervisor info + compliance checklist + notes
 *   5. Review & Submit       — read-only summary before saving
 *
 * WCAG 2.1 AA:
 *  ✓ All fields have visible <label> via FormLabel (WCAG 1.3.1, 2.4.6)
 *  ✓ Required fields marked aria-required (WCAG 3.3.2)
 *  ✓ Errors tied to inputs via aria-describedby (WCAG 3.3.1)
 *  ✓ Step indicator conveys state via aria-current="step" (WCAG 1.3.1)
 *  ✓ Focus moves to step heading on advance for screen readers (WCAG 2.4.3)
 *  ✓ Date inputs use Calendar + Popover — never plain text input (date-picker guideline)
 *  ✓ Review section uses <dl> with visible term/value pairs (WCAG 1.3.1)
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFormContext, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { devLog } from "@/lib/dev-log"
import { formatDateUS } from "@/lib/date-filter"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input }    from "@/components/ui/input"
import { Button }   from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label }    from "@/components/ui/label"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tip } from "@/components/ui/tip"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { useModKeyLabel, useAltKeyLabel } from "@/hooks/use-mod-key-label"

// ── Constants ─────────────────────────────────────────────────────────────────

const PROGRAMS = [
  "Nursing",
  "Physical Therapy",
  "Occupational Therapy",
  "Social Work",
  "Pharmacy",
  "Respiratory Therapy",
  "Medical Laboratory Science",
  "Radiologic Technology",
  "Dental Hygiene",
  "Dietetics",
]

const SITES = [
  "City Medical Center",
  "Metro Rehab",
  "Bay Area Health",
  "Sunrise Hospital",
  "Community Care",
  "Summit Sports Med",
  "Harbor Medical",
  "Valley Health",
  "Westside Clinic",
  "Hope Community Ctr",
  "Lakeside Hospital",
]

const DEPARTMENTS = [
  "Emergency Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Neurology",
  "General Surgery",
  "Internal Medicine",
  "Rehabilitation",
  "Outpatient Clinic",
]

const SUPERVISORS = [
  "Dr. Patel",
  "Dr. Kim",
  "Dr. Torres",
  "Dr. Lee",
  "Dr. Wong",
  "Dr. Santos",
  "Ms. Torres",
  "Dr. Martinez",
  "Dr. Chen",
]

const DURATIONS = [
  "4 weeks",
  "6 weeks",
  "8 weeks",
  "10 weeks",
  "12 weeks",
  "16 weeks",
  "24 weeks",
]

const SHIFTS = [
  "Day shift (7 AM – 3 PM)",
  "Evening shift (3 PM – 11 PM)",
  "Night shift (11 PM – 7 AM)",
  "Flexible / varies",
]

// ── Zod schema ────────────────────────────────────────────────────────────────

const placementSchema = z
  .object({
    // Step 1 — Student
    firstName:    z.string().min(1, "First name is required"),
    lastName:     z.string().min(1, "Last name is required"),
    email:        z.string().min(1, "Email is required").email("Enter a valid email address"),
    studentId:    z.string().min(1, "Student ID is required"),
    phone:        z.string().optional(),
    program:      z.string().min(1, "Program is required"),
    cohort:       z.string().min(1, "Cohort / class year is required"),
    gpa:          z.string().optional(),

    // Step 2 — Site
    site:         z.string().min(1, "Clinical site is required"),
    department:   z.string().min(1, "Department is required"),
    siteAddress:  z.string().min(1, "Site address is required"),
    siteContact:  z.string().optional(),
    sitePhone:    z.string().optional(),
    rotation:     z.enum(["clinical", "field", "internship", "practicum"]).refine(
      v => v !== undefined,
      { message: "Rotation type is required" }
    ),
    creditHours:  z.string().min(1, "Credit hours are required"),

    // Step 3 — Schedule (dates stored as Date objects — Calendar picker)
    startDate:    z.date({ error: "Start date is required" }),
    endDate:      z.date({ error: "End date is required" }),
    duration:     z.string().min(1, "Duration is required"),
    hoursPerWeek: z.string().min(1, "Hours per week is required"),
    shift:        z.string().min(1, "Shift is required"),
    totalHours:   z.string().optional(),
    onWeekends:   z.boolean().default(false),
    remoteOption: z.enum(["on-site", "remote", "hybrid"]).refine(
      v => v !== undefined,
      { message: "Work arrangement is required" }
    ),

    // Step 4 — Supervisor & compliance
    supervisor:           z.string().min(1, "Supervisor is required"),
    supervisorEmail:      z.string().email("Enter a valid email").or(z.literal("")).optional(),
    supervisorPhone:      z.string().optional(),
    preceptor:            z.string().optional(),
    objectives:           z.string().min(10, "Enter at least a brief learning objective"),
    specialRequirements:  z.string().optional(),
    backgroundCheck:      z.boolean().default(false),
    immunizationOk:       z.boolean().default(false),
    hipaaTraining:        z.boolean().default(false),
    notes:                z.string().optional(),
  })
  .refine(d => d.endDate >= d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

type PlacementFormValues = z.infer<typeof placementSchema>

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Student",    icon: "fa-user-graduate"   },
  { id: 2, label: "Site",       icon: "fa-hospital"        },
  { id: 3, label: "Schedule",   icon: "fa-calendar-days"   },
  { id: 4, label: "Supervisor", icon: "fa-user-tie"        },
  { id: 5, label: "Review",     icon: "fa-clipboard-check" },
] as const

// Fields validated at each step before advancing
const STEP_FIELDS: Record<number, (keyof PlacementFormValues)[]> = {
  1: ["firstName", "lastName", "email", "studentId", "program", "cohort"],
  2: ["site", "department", "siteAddress", "rotation", "creditHours"],
  3: ["startDate", "endDate", "duration", "hoursPerWeek", "shift", "remoteOption"],
  4: ["supervisor", "objectives"],
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Form steps" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < current
          const isActive    = step.id === current
          const isLast      = idx === STEPS.length - 1

          return (
            <React.Fragment key={step.id}>
              <li className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    isCompleted && "border-emerald-600 bg-emerald-600 text-white",
                    isActive    && "border-brand bg-brand/10 text-brand",
                    !isCompleted && !isActive && "border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  {isCompleted
                    ? <i className="fa-light fa-check text-xs" aria-hidden="true" />
                    : <span>{step.id}</span>
                  }
                  <span className="sr-only">
                    Step {step.id}: {step.label}
                    {isCompleted ? " (completed)" : isActive ? " (current)" : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "hidden sm:block text-xs whitespace-nowrap",
                    isActive    && "text-foreground font-medium",
                    isCompleted && "text-emerald-600 font-medium",
                    !isCompleted && !isActive && "text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {step.label}
                </span>
              </li>

              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors",
                    step.id < current ? "bg-emerald-600" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-border">
      <div className="flex items-center justify-center size-9 rounded-lg bg-secondary text-secondary-foreground shrink-0 mt-0.5" aria-hidden="true">
        <i className={`fa-light ${icon} text-base`} />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

// ── Step 1 — Student ──────────────────────────────────────────────────────────

function Step1() {
  const form = useFormContext<PlacementFormValues>()
  return (
    <div>
      <SectionHeading icon="fa-user-graduate" title="Student Information" description="Enter the student's personal and academic details." />
      <div className="space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First name <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl><Input placeholder="Jane" {...field} aria-required="true" autoComplete="given-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last name <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl><Input placeholder="Smith" {...field} aria-required="true" autoComplete="family-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email address <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <Input type="email" placeholder="jane.smith@university.edu" {...field} aria-required="true" autoComplete="email" />
            </FormControl>
            <FormDescription>Must be the student's institutional email.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="studentId" render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl><Input placeholder="STU-2024-0001" {...field} aria-required="true" /></FormControl>
              <FormDescription>STU-YYYY-####</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl><Input type="tel" placeholder="+1 (555) 000-0000" {...field} autoComplete="tel" /></FormControl>
              <FormDescription>+1 (555) 555-0100</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="program" render={({ field }) => (
          <FormItem>
            <FormLabel>Program <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true"><SelectValue placeholder="Select a program" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="cohort" render={({ field }) => (
            <FormItem>
              <FormLabel>Cohort / Class year <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl><Input placeholder="2025" {...field} aria-required="true" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="gpa" render={({ field }) => (
            <FormItem>
              <FormLabel>GPA <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl><Input placeholder="3.8" {...field} /></FormControl>
              <FormDescription>Out of 4.0</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

      </div>
    </div>
  )
}

// ── Step 2 — Site & Program ───────────────────────────────────────────────────

function Step2() {
  const form = useFormContext<PlacementFormValues>()
  return (
    <div>
      <SectionHeading icon="fa-hospital" title="Site & Program Details" description="Where will the placement take place, and what type of rotation?" />
      <div className="space-y-5">

        <FormField control={form.control} name="site" render={({ field }) => (
          <FormItem>
            <FormLabel>Clinical site <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true"><SelectValue placeholder="Select a site" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SITES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="department" render={({ field }) => (
          <FormItem>
            <FormLabel>Department <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true"><SelectValue placeholder="Select a department" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="siteAddress" render={({ field }) => (
          <FormItem>
            <FormLabel>Site address <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <Input placeholder="1400 N Lake Shore Dr, Chicago, IL 60610" {...field} aria-required="true" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="siteContact" render={({ field }) => (
            <FormItem>
              <FormLabel>Site contact <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl><Input placeholder="Coordinator name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sitePhone" render={({ field }) => (
            <FormItem>
              <FormLabel>Site phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl><Input type="tel" placeholder="+1 (555) 000-0000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="rotation" render={({ field }) => (
          <FormItem>
            <FormLabel>Rotation type <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2 mt-1" aria-required="true">
                {([
                  { value: "clinical",   label: "Clinical",   icon: "fa-stethoscope"    },
                  { value: "field",      label: "Field",      icon: "fa-map-location"   },
                  { value: "internship", label: "Internship", icon: "fa-briefcase"      },
                  { value: "practicum",  label: "Practicum",  icon: "fa-graduation-cap" },
                ] as const).map(opt => (
                  <Label
                    key={opt.value}
                    htmlFor={`rot-${opt.value}`}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer transition-colors hover:bg-interactive-hover has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10"
                  >
                    <RadioGroupItem value={opt.value} id={`rot-${opt.value}`} />
                    <i className={`fa-light ${opt.icon} text-muted-foreground text-sm`} aria-hidden="true" />
                    <span className="text-sm">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="creditHours" render={({ field }) => (
          <FormItem>
            <FormLabel>Credit hours <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <Input type="number" min={1} max={20} placeholder="3" className="w-32" {...field} aria-required="true" />
            </FormControl>
            <FormDescription>Number of academic credit hours for this placement.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

      </div>
    </div>
  )
}

// ── Step 3 — Schedule ─────────────────────────────────────────────────────────

function Step3() {
  const form = useFormContext<PlacementFormValues>()
  return (
    <div>
      <SectionHeading icon="fa-calendar-days" title="Schedule" description="Define the placement timeline, hours, and work arrangement." />
      <div className="space-y-5">

        {/* Start + End date — using Calendar+Popover (date-picker guideline) */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl>
                <DatePickerField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>MM/DD/YYYY</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel>End Date <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl>
                <DatePickerField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>MM/DD/YYYY</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-required="true"><SelectValue placeholder="Select duration" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hoursPerWeek" render={({ field }) => (
            <FormItem>
              <FormLabel>Hours per week <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
              <FormControl>
                <Input type="number" min={1} max={80} placeholder="40" {...field} aria-required="true" />
              </FormControl>
              <FormDescription>hrs/wk</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="shift" render={({ field }) => (
          <FormItem>
            <FormLabel>Shift <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true"><SelectValue placeholder="Select a shift" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="totalHours" render={({ field }) => (
          <FormItem>
            <FormLabel>Total required hours <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
            <FormControl>
              <Input type="number" min={1} placeholder="480" className="w-40" {...field} />
            </FormControl>
            <FormDescription>Minimum hours the student must complete.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="remoteOption" render={({ field }) => (
          <FormItem>
            <FormLabel>Work arrangement <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-3 mt-1" aria-required="true">
                {([
                  { value: "on-site", label: "On-site",  icon: "fa-building"             },
                  { value: "remote",  label: "Remote",   icon: "fa-house-laptop"          },
                  { value: "hybrid",  label: "Hybrid",   icon: "fa-circle-half-stroke"    },
                ] as const).map(opt => (
                  <Label
                    key={opt.value}
                    htmlFor={`mode-${opt.value}`}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 cursor-pointer transition-colors hover:bg-interactive-hover has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10 flex-1 justify-center"
                  >
                    <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                    <i className={`fa-light ${opt.icon} text-muted-foreground text-sm`} aria-hidden="true" />
                    <span className="text-sm whitespace-nowrap">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="onWeekends" render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-interactive-hover transition-colors has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10">
              <FormControl>
                <Checkbox id="on-weekends" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <Label htmlFor="on-weekends" className="text-sm font-medium cursor-pointer leading-none">
                  Includes weekend hours
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Student may be scheduled on Saturdays or Sundays.</p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )} />

      </div>
    </div>
  )
}

// ── Step 4 — Supervisor & Compliance ─────────────────────────────────────────

const COMPLIANCE_ITEMS = [
  { name: "backgroundCheck" as const, label: "Background check completed",    desc: "Student has passed required background screening." },
  { name: "immunizationOk"  as const, label: "Immunization records verified", desc: "All required vaccinations are on file." },
  { name: "hipaaTraining"   as const, label: "HIPAA training completed",       desc: "Student has completed HIPAA privacy training." },
]

function Step4() {
  const form = useFormContext<PlacementFormValues>()
  return (
    <div>
      <SectionHeading icon="fa-user-tie" title="Supervisor & Compliance" description="Assign a supervisor and confirm compliance requirements." />
      <div className="space-y-5">

        <FormField control={form.control} name="supervisor" render={({ field }) => (
          <FormItem>
            <FormLabel>Primary supervisor <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true"><SelectValue placeholder="Select a supervisor" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SUPERVISORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="supervisorEmail" render={({ field }) => (
            <FormItem>
              <FormLabel>Supervisor email <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Input type="email" placeholder="supervisor@hospital.org" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="supervisorPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>Supervisor phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="preceptor" render={({ field }) => (
          <FormItem>
            <FormLabel>Preceptor / secondary supervisor <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
            <FormControl><Input placeholder="On-site preceptor name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="objectives" render={({ field }) => (
          <FormItem>
            <FormLabel>Learning objectives <span className="text-destructive" aria-hidden="true">*</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the primary learning goals for this placement…"
                className="min-h-[100px] resize-y"
                {...field}
                aria-required="true"
              />
            </FormControl>
            <FormDescription>Competencies and skills the student should develop.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="specialRequirements" render={({ field }) => (
          <FormItem>
            <FormLabel>Special requirements <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Dress code, languages, certifications, etc."
                className="min-h-[80px] resize-y"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Compliance checklist */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Compliance checklist</legend>
          {COMPLIANCE_ITEMS.map(item => (
            <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-interactive-hover transition-colors has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10">
                  <FormControl>
                    <Checkbox
                      id={item.name}
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 shrink-0"
                    />
                  </FormControl>
                  <div className="min-w-0">
                    <Label htmlFor={item.name} className="text-sm font-medium cursor-pointer leading-none">{item.label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )} />
          ))}
        </fieldset>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Internal notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any internal notes visible only to coordinators…"
                className="min-h-[80px] resize-y"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

      </div>
    </div>
  )
}

// ── Step 5 — Review ───────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
      <dt className="text-sm text-muted-foreground shrink-0 w-40">{label}</dt>
      <dd className="text-sm text-foreground text-right break-all">
        {value || <span className="text-muted-foreground italic">—</span>}
      </dd>
    </div>
  )
}

function ReviewSection({
  title, icon, onEdit, children,
}: { title: string; icon: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <i className={`fa-light ${icon} text-sm text-muted-foreground`} aria-hidden="true" />
          <span>{title}</span>
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1.5"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
          >
            <i className="fa-light fa-pen text-xs" aria-hidden="true" />
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl>{children}</dl>
      </CardContent>
    </Card>
  )
}

function Step5({
  data,
  goToStep,
}: {
  data: Partial<PlacementFormValues>
  goToStep: (n: number) => void
}) {
  return (
    <div>
      <SectionHeading icon="fa-clipboard-check" title="Review & Submit" description="Review all details before creating the placement." />
      <div className="space-y-4">

        <ReviewSection title="Student Information" icon="fa-user-graduate" onEdit={() => goToStep(1)}>
          <ReviewRow label="Name"       value={[data.firstName, data.lastName].filter(Boolean).join(" ")} />
          <ReviewRow label="Email"      value={data.email} />
          <ReviewRow label="Student ID" value={data.studentId} />
          <ReviewRow label="Phone"      value={data.phone} />
          <ReviewRow label="Program"    value={data.program} />
          <ReviewRow label="Cohort"     value={data.cohort} />
          <ReviewRow label="GPA"        value={data.gpa} />
        </ReviewSection>

        <ReviewSection title="Site & Program" icon="fa-hospital" onEdit={() => goToStep(2)}>
          <ReviewRow label="Site"         value={data.site} />
          <ReviewRow label="Department"   value={data.department} />
          <ReviewRow label="Address"      value={data.siteAddress} />
          <ReviewRow label="Site Contact" value={data.siteContact} />
          <ReviewRow label="Rotation"     value={data.rotation ? data.rotation.charAt(0).toUpperCase() + data.rotation.slice(1) : undefined} />
          <ReviewRow label="Credit Hours" value={data.creditHours} />
        </ReviewSection>

        <ReviewSection title="Schedule" icon="fa-calendar-days" onEdit={() => goToStep(3)}>
          <ReviewRow label="Start Date"   value={data.startDate ? formatDateUS(data.startDate.toISOString()) : undefined} />
          <ReviewRow label="End Date"     value={data.endDate   ? formatDateUS(data.endDate.toISOString())   : undefined} />
          <ReviewRow label="Duration"     value={data.duration} />
          <ReviewRow label="Hours / Week" value={data.hoursPerWeek ? `${data.hoursPerWeek} hrs` : undefined} />
          <ReviewRow label="Shift"        value={data.shift} />
          <ReviewRow label="Arrangement"  value={data.remoteOption} />
          <ReviewRow label="Weekends"     value={data.onWeekends ? "Yes" : "No"} />
        </ReviewSection>

        <ReviewSection title="Supervisor & Compliance" icon="fa-user-tie" onEdit={() => goToStep(4)}>
          <ReviewRow label="Supervisor"       value={data.supervisor} />
          <ReviewRow label="Supervisor Email" value={data.supervisorEmail} />
          <ReviewRow label="Preceptor"        value={data.preceptor} />
          <ReviewRow label="Background ✓"     value={data.backgroundCheck ? "Yes" : "No"} />
          <ReviewRow label="Immunization ✓"   value={data.immunizationOk  ? "Yes" : "No"} />
          <ReviewRow label="HIPAA ✓"          value={data.hipaaTraining   ? "Yes" : "No"} />
        </ReviewSection>

        <p className="text-xs text-muted-foreground text-center pt-1">
          By submitting, you confirm all details are accurate and the student has been notified.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NewPlacementForm() {
  const router   = useRouter()
  const [step, setStep]           = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const stepHeadingRef = React.useRef<HTMLDivElement>(null)

  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema) as Resolver<PlacementFormValues>,
    mode: "onTouched",
    defaultValues: {
      firstName: "", lastName: "", email: "", studentId: "", phone: "",
      program: "", cohort: "", gpa: "",
      site: "", department: "", siteAddress: "", siteContact: "", sitePhone: "",
      rotation: undefined, creditHours: "",
      startDate: undefined, endDate: undefined,
      duration: "", hoursPerWeek: "", shift: "", totalHours: "",
      remoteOption: undefined, onWeekends: false,
      supervisor: "", supervisorEmail: "", supervisorPhone: "",
      preceptor: "", objectives: "", specialRequirements: "",
      backgroundCheck: false, immunizationOk: false, hipaaTraining: false, notes: "",
    },
  })

  // Move focus to the top section heading when step changes (WCAG 2.4.3)
  React.useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [step])

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    if (fields) {
      const ok = await form.trigger(fields)
      if (!ok) return
    }
    setStep(s => Math.min(s + 1, 5))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goToStep(n: number) {
    setStep(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(values: PlacementFormValues) {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1400))
    devLog("New placement:", values)
    setSubmitting(false)
    router.push("/data-list")
  }

  const formData = form.watch()
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  return (
    <Form {...form}>
      {/* Implicit submit only fires on step 5 (Review) — Enter on earlier steps is ignored so the review never auto-closes when users hit Enter inside an input on steps 1–4. */}
      <form
        onSubmit={(e) => {
          if (step !== 5) { e.preventDefault(); return }
          form.handleSubmit(handleSubmit)(e)
        }}
        noValidate
        aria-label="New placement form"
      >
        {/* Steps 1–4: ⌘Enter advances. Step 5: ⌘Enter submits — plain Enter is intentionally NOT bound:
            a global Enter shortcut would fire when focus is on the step container (we focus it for
            a11y after each step), submitting the form without an explicit submit action — felt like
            "Review auto-closes". Native Enter on the primary submit button still works. */}
        {step < 5 && <Shortcut keys="⌘Enter" disabled={submitting} onInvoke={handleNext} />}
        {step === 5 && <Shortcut keys="⌘Enter" disabled={submitting} onInvoke={() => form.handleSubmit(handleSubmit)()} />}
        {step > 1 && <Shortcut keys="⌘⌥←" disabled={submitting} onInvoke={handleBack} /> }
        <StepIndicator current={step} />

        {/* Step content — ref captures focus when step changes */}
        <div ref={stepHeadingRef} tabIndex={-1} className="outline-none">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          {step === 5 && <Step5 data={formData} goToStep={goToStep} />}
        </div>

        {/* Navigation — sticky at bottom of scroll container */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border flex items-center justify-between mt-8 py-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map(s => (
              <div
                key={s.id}
                className={cn(
                  "rounded-full transition-all h-1.5",
                  s.id === step  ? "w-6 bg-brand"   :
                  s.id < step    ? "w-3 bg-brand/40" :
                                   "w-3 bg-border"
                )}
              />
            ))}
          </div>

          {/* Back + Next grouped together */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || submitting}
            >
              <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
              Back
              <KbdGroup className="ml-1.5">
                <Kbd variant="bare">{mod}{alt}←</Kbd>
              </KbdGroup>
            </Button>

            {step < 5 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <i className="fa-light fa-arrow-right text-[13px]" aria-hidden="true" />
                <KbdGroup className="ml-1.5">
                  <Kbd variant="bare">{mod}⏎</Kbd>
                </KbdGroup>
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? (
                  <>
                    <i className="fa-light fa-spinner-third fa-spin text-[13px]" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <i className="fa-light fa-check text-[13px]" aria-hidden="true" />
                    Create placement
                    <KbdGroup className="ml-1.5">
                      <Kbd variant="bare">{mod}⏎</Kbd>
                    </KbdGroup>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
