import type { TodoTask } from "@/components/shared/todo-task-card";
import { logoUrl } from "./jobs-data";

export const mockTodoTasks: TodoTask[] = [
  {
    id: "1",
    taskType: "Wishlist",
    taskTypeIcon: "heart",
    title: "Spring 2025 Clinical Rotation",
    actionNeeded: true,
    dueDate: new Date("2025-09-10"),
    stage: "upcoming",
    availabilities: 80,
    programType: "Clinical PT Applications",
    dateRange: {
      start: new Date("2025-10-01"),
      end: new Date("2025-10-15"),
    },
  },
  {
    id: "2",
    taskType: "Placement Schedule",
    taskTypeIcon: "calendarDays",
    siteLogo: logoUrl("sandypines.org"),
    siteName: "SandyPines Adolescent Residential Treatment Center",
    title: "Summer 2025 Externship Application",
    actionNeeded: false,
    dueDate: new Date("2025-04-15"),
    stage: "upcoming",
    address: "1234 Maple Avenue, Baltimore, MD 21201",
    specialty: "OP-Pelvic Health",
    dateRange: {
      start: new Date("2026-03-01"),
      end: new Date("2026-03-18"),
    },
    shift: "Day Shift (9:00AM-6:00PM) M,T+1",
    primaryActionLabel: "Complete Requirements",
  },
  {
    id: "3",
    taskType: "Account Settings",
    taskTypeIcon: "mail",
    title: "Add secondary email",
    actionNeeded: true,
    stage: "upcoming",
    programType:
      "Add a backup email for account recovery and to keep your account secure if you lose access to your primary email.",
    primaryActionLabel: "Add Email",
  },
];
