import type { IconName } from "../brand/font-awesome-icon";
import Leo from "../../imports/Leo-68-134";

const LeoIcon = () => (
  <div className="h-4 w-4 flex items-center justify-center text-foreground">
    <Leo />
  </div>
);

export const sidebarData = {
  user: {
    name: "Sarah Morgan",
    email: "sarah.morgan@example.com",
    avatar: "https://images.pexels.com/photos/32115901/pexels-photo-32115901.jpeg?auto=compress&w=128&h=128&fit=crop",
  },
  teams: [
    { name: "Program A", logo: "graduation-cap" as IconName, plan: "BSc Program" },
    { name: "Program B", logo: "graduation-cap" as IconName, plan: "MSc Program" },
    { name: "Program C", logo: "graduation-cap" as IconName, plan: "Certificate Program" },
  ],
  programExclusions: {
    "Program A": ["Browse"],
    "Program B": [],
    "Program C": [],
  } as Record<string, string[]>,
  navMain: [
    { title: "Home", url: "#", icon: "home" as IconName, navGroup: "primary" as const },
    { title: "Leo AI", url: "#", icon: LeoIcon, badge: "Beta", navGroup: "primary" as const },
    { title: "Inbox", url: "#", icon: "inbox" as IconName, badge: "15", navGroup: "primary" as const },
    { title: "Browse", url: "#", icon: "compass" as IconName, navGroup: "pipeline" as const },
    { title: "Saved", url: "#", icon: "heart" as IconName, badge: "New", navGroup: "pipeline" as const },
    { title: "Slots", url: "#", icon: "layer-group" as IconName, badge: "24", navGroup: "pipeline" as const },
    { title: "Schedules", url: "#", icon: "calendar" as IconName, badge: "12", navGroup: "pipeline" as const },
    { title: "Reports", url: "#", icon: "chart-bar" as IconName, navGroup: "supporting" as const },
    { title: "People", url: "#", icon: "users" as IconName, navGroup: "supporting" as const },
    { title: "Organizations", url: "#", icon: "building" as IconName, navGroup: "supporting" as const },
  ],
  projects: [
    { name: "Requests", url: "#", icon: "graduation-cap" as IconName },
    { name: "Assignments", url: "#", icon: "clock" as IconName },
  ],
  resourcesAndHelp: [
    { name: "Help Center", url: "#", icon: "book-open" as IconName },
    { name: "Contact Support", url: "#", icon: "life-buoy" as IconName },
  ],
  support: [
    { name: "Settings", url: "#", icon: "gear" as IconName },
    { name: "Design System", url: "#", icon: "palette" as IconName },
  ],
};
