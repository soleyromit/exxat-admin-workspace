"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Badge,
  CountText,
  NewBadge,
  BetaBadge,
  CountBadge,
} from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "../ui/sidebar";
import Leo from "../../imports/Leo-68-134";
import { ExxatOneLogo } from "../brand/exxat-one-logo";
import { useAppStore } from "../../stores/app-store";
import { cn } from "../ui/utils";

// Wrapper component to constrain Leo icon size
const LeoIcon = () => (
  <div className="h-4 w-4 flex items-center justify-center text-foreground">
    <Leo />
  </div>
);

// This is sample data for Exxat One
const data = {
  user: {
    name: "Sarah Morgan",
    email: "sarah.morgan@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
  },
  teams: [
    {
      name: "Program A",
      logo: "graduation-cap" as IconName,
      plan: "BSc Program",
    },
    {
      name: "Program B",
      logo: "graduation-cap" as IconName,
      plan: "MSc Program",
    },
    {
      name: "Program C",
      logo: "graduation-cap" as IconName,
      plan: "Certificate Program",
    },
  ],
  // Pipeline items excluded per program (Slots and Wishlist always visible)
  programExclusions: {
    "Program A": ["Browse"],
    "Program B": [],
    "Program C": [],
  } as Record<string, string[]>,
  navMain: [
    // ── PRIMARY NAV ── Core daily-driver pages
    {
      title: "Home",
      url: "#",
      icon: "home" as IconName,
      isActive: true,
      navGroup: "primary" as const,
    },
    {
      title: "Leo AI",
      url: "#",
      icon: LeoIcon,
      isActive: false,
      badge: "Beta",
      navGroup: "primary" as const,
    },
    {
      title: "Inbox",
      url: "#",
      icon: "inbox" as IconName,
      isActive: false,
      badge: "15",
      navGroup: "primary" as const,
    },
    // ── PIPELINE ── Workflow stages (Browse → Saved → Slots → Schedules)
    {
      title: "Browse",
      url: "#",
      icon: "compass" as IconName,
      isActive: false,
      navGroup: "pipeline" as const,
    },
    {
      title: "Saved",
      url: "#",
      icon: "heart" as IconName,
      isActive: false,
      badge: "New",
      navGroup: "pipeline" as const,
    },
    {
      title: "Slots",
      url: "#",
      icon: "layer-group" as IconName,
      isActive: false,
      badge: "24",
      navGroup: "pipeline" as const,
    },
    {
      title: "Schedules",
      url: "#",
      icon: "calendar" as IconName,
      isActive: false,
      badge: "12",
      navGroup: "pipeline" as const,
    },
    // ── SUPPORTING ── Reference data & analytics
    {
      title: "Reports",
      url: "#",
      icon: "chart-bar" as IconName,
      isActive: false,
      navGroup: "supporting" as const,
    },
    {
      title: "People",
      url: "#",
      icon: "users" as IconName,
      isActive: false,
      navGroup: "supporting" as const,
    },
    {
      title: "Organizations",
      url: "#",
      icon: "building" as IconName,
      isActive: false,
      navGroup: "supporting" as const,
    },
  ],
  projects: [
    {
      name: "Requests",
      url: "#",
      icon: "graduation-cap" as IconName,
    },
    {
      name: "Assignments",
      url: "#",
      icon: "clock" as IconName,
    },
  ],
  resourcesAndHelp: [
    {
      name: "Help Center",
      url: "#",
      icon: "book-open" as IconName,
    },
    {
      name: "Contact Support",
      url: "#",
      icon: "life-buoy" as IconName,
    },
  ],
  support: [
    {
      name: "Settings",
      url: "#",
      icon: "gear" as IconName,
    },
    {
      name: "Design System",
      url: "#",
      icon: "palette" as IconName,
    },
  ],
  notifications: [
    {
      id: "1",
      name: "Jordan Lee",
      title: "New Slot Request",
      message: "Jordan Lee has submitted a new slot request for the upcoming term. Review and approve to confirm placement.",
      type: "request",
      icon: "alertCircle" as IconName,
      time: "2 minutes ago",
      isRead: false,
    },
    {
      id: "2",
      name: "Sam Rivera",
      title: "Schedule Approved",
      message: "The schedule for Sam Rivera has been approved by the site coordinator. Confirmation sent.",
      type: "success",
      icon: "checkCircle" as IconName,
      time: "1 hour ago",
      isRead: false,
    },
    {
      id: "3",
      name: "Westside Center",
      title: "Capacity Updated",
      message: "Westside Center has updated available slots for the upcoming term. 5 new positions are now open.",
      type: "info",
      icon: "circleInfo" as IconName,
      time: "3 hours ago",
      isRead: false,
    },
    {
      id: "4",
      name: "Casey Kim",
      title: "Slot Request Cancelled",
      message: "Casey Kim has cancelled their slot request due to a schedule conflict. The slot has been freed.",
      type: "warning",
      icon: "alertCircle" as IconName,
      time: "5 hours ago",
      isRead: true,
    },
    {
      id: "5",
      name: "Dr. R. Patel",
      title: "Evaluation Submitted",
      message: "Dr. R. Patel has submitted the mid-term evaluation. Review results in the compliance dashboard.",
      type: "success",
      icon: "fileBarChart" as IconName,
      time: "8 hours ago",
      isRead: false,
    },
    {
      id: "6",
      name: "System Alert",
      title: "Document Upload Required",
      message: "Morgan Chen needs to upload required documents before the assignment start date.",
      type: "warning",
      icon: "upload" as IconName,
      time: "12 hours ago",
      isRead: false,
    },
    {
      id: "7",
      name: "Taylor Brooks",
      title: "Placement Confirmed",
      message: "Placement confirmed for Taylor Brooks at Northern Site from 03/15 to 04/30.",
      type: "success",
      icon: "checkCircle" as IconName,
      time: "Yesterday",
      isRead: true,
    },
    {
      id: "8",
      name: "Northern Site",
      title: "Requirements Updated",
      message: "Northern Site has updated their onboarding requirements. Review before assigning new placements.",
      type: "info",
      icon: "shield" as IconName,
      time: "Yesterday",
      isRead: false,
    },
    {
      id: "9",
      name: "Dr. M. Santos",
      title: "Reference Submitted",
      message: "Dr. M. Santos has submitted a reference letter. It's now available in the student record.",
      type: "success",
      icon: "star" as IconName,
      time: "2 days ago",
      isRead: true,
    },
    {
      id: "10",
      name: "Eastside Academy",
      title: "New Partnership",
      message: "Eastside Academy has joined the network with 20 placements available for the next cycle.",
      type: "success",
      icon: "graduation-cap" as IconName,
      time: "2 days ago",
      isRead: false,
    },
    {
      id: "11",
      name: "Riley Thompson",
      title: "Attendance Alert",
      message: "Riley Thompson has exceeded the allowed absence threshold for the current term.",
      type: "warning",
      icon: "alertTriangle" as IconName,
      time: "3 days ago",
      isRead: true,
    },
    {
      id: "12",
      name: "Admin Team",
      title: "Orientation Scheduled",
      message: "Orientation is scheduled for 03/10 at 9:00 AM for all participants starting new placements.",
      type: "info",
      icon: "calendar" as IconName,
      time: "3 days ago",
      isRead: false,
    },
    {
      id: "13",
      name: "Dana Wright",
      title: "Assignment Completed",
      message: "Dana Wright has successfully completed the assignment with excellent performance ratings.",
      type: "success",
      icon: "award" as IconName,
      time: "4 days ago",
      isRead: true,
    },
    {
      id: "14",
      name: "Dr. A. Foster",
      title: "Mentor Application",
      message: "Dr. A. Foster has applied to become a mentor. Review their profile and credentials.",
      type: "request",
      icon: "userPlus" as IconName,
      time: "5 days ago",
      isRead: false,
    },
    {
      id: "15",
      name: "System Update",
      title: "Integration Complete",
      message: "The billing integration is now live. Fees will be processed automatically going forward.",
      type: "success",
      icon: "creditCard" as IconName,
      time: "5 days ago",
      isRead: true,
    },
    {
      id: "16",
      name: "Southern Hub",
      title: "Capacity Expanded",
      message: "Southern Hub has expanded capacity and can now accept 10 additional placements per term.",
      type: "info",
      icon: "trendingUp" as IconName,
      time: "1 week ago",
      isRead: false,
    },
    {
      id: "17",
      name: "Jamie Clark",
      title: "Extension Request",
      message: "Jamie Clark has requested a 2-week extension for the current assignment.",
      type: "request",
      icon: "timer" as IconName,
      time: "1 week ago",
      isRead: true,
    },
    {
      id: "18",
      name: "Compliance Team",
      title: "Monthly Audit Complete",
      message: "Monthly compliance audit completed. All sites are meeting standards with a 98% pass rate.",
      type: "success",
      icon: "clipboard" as IconName,
      time: "1 week ago",
      isRead: true,
    },
    {
      id: "19",
      name: "Western Institute",
      title: "New Program Launch",
      message: "Western Institute is launching a new specialty program starting next semester. Applications open.",
      type: "info",
      icon: "zap" as IconName,
      time: "2 weeks ago",
      isRead: false,
    },
    {
      id: "20",
      name: "System Alert",
      title: "Maintenance Scheduled",
      message: "System maintenance is scheduled this weekend from 2 AM to 6 AM. Plan accordingly.",
      type: "info",
      icon: "settings-2" as IconName,
      time: "2 weeks ago",
      isRead: true,
    },
  ],
};

interface AppSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  onNotificationsChange?: (show: boolean) => void;
  onNavigationChange?: (page: string) => void;
  currentPage?: string;
}

export function AppSidebar({
  onNotificationsChange,
  onNavigationChange,
  currentPage = "Home",
  ...props
}: AppSidebarProps) {
  const showNotifications = useAppStore((s) => s.showNotifications);
  const [activeProgram, setActiveProgram] = React.useState(data.teams[0].name);

  const { state } = useSidebar();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const hadPanelOpen = React.useRef(false);

  // Expand main nav when Inbox closes
  React.useEffect(() => {
    if (hadPanelOpen.current && !showNotifications) {
      setSidebarOpen(true);
    }
    hadPanelOpen.current = showNotifications;
  }, [showNotifications, setSidebarOpen]);

  // Filter nav items based on selected program
  const filteredNavMain = React.useMemo(() => {
    const exclusions = data.programExclusions[activeProgram] || [];
    return data.navMain.filter((item) => !exclusions.includes(item.title));
  }, [activeProgram]);

  const handleNavClick = (item: any) => {
    if (item.title === "Inbox") {
      onNotificationsChange?.(true);
      if (onNavigationChange) onNavigationChange("Inbox");
      setSidebarOpen(false); // Collapse main nav when Inbox opens
    } else {
      onNotificationsChange?.(false);
      if (onNavigationChange) onNavigationChange(item.title ?? item.name);
    }
  };

  // Respect user's sidebar toggle; only force-collapse when opening a panel (handled in handleNavClick)
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      {/* This is the first sidebar - Main Navigation */}
      <Sidebar
        collapsible="none"
        className={`${isCollapsed ? "w-12" : "w-[240px]"} transition-all duration-200 group`}
        data-collapsible={isCollapsed ? "icon" : "none"}
        data-state={isCollapsed ? "collapsed" : "expanded"}
      >
        <SidebarHeader
          className={`${isCollapsed ? "items-center" : ""}`}
        >
          {/* Exxat One Logo at the top - Responsive */}
          <div className="px-3 py-2 border-b border-sidebar-border">
            {isCollapsed ? (
              <div className="h-8 w-8 flex items-center justify-center mx-auto overflow-hidden">
                <ExxatOneLogo className="h-8 w-8" objectPosition="left" />
              </div>
            ) : (
              <ExxatOneLogo className="h-8" />
            )}
          </div>

          <TeamSwitcher teams={data.teams} isCollapsed={isCollapsed} onProgramChange={setActiveProgram} />
        </SidebarHeader>

        <SidebarContent>
          {/* AI & Analytics Section */}
          <SidebarGroup>
            <SidebarGroupContent
              className={cn("flex flex-col", isCollapsed ? "px-0" : "px-1.5 md:px-0")}
            >
              <SidebarMenu className="overflow-visible group-data-[collapsible=icon]:items-center">
                {filteredNavMain.map((item, index) => {
                  // Determine if we need a section label before this item
                  const prevItem = index > 0 ? filteredNavMain[index - 1] : null;
                  const showPipelineLabel = prevItem && prevItem.navGroup === "primary" && item.navGroup === "pipeline";
                  const showSupportingLabel = prevItem && prevItem.navGroup === "pipeline" && item.navGroup === "supporting";

                  return (
                  <div key={item.title}>
                    {/* ── Section labels between nav groups ── */}
                    {showPipelineLabel && !isCollapsed && (
                      <SidebarGroupLabel className="mt-2">Pipeline</SidebarGroupLabel>
                    )}
                    {showSupportingLabel && !isCollapsed && (
                      <SidebarGroupLabel className="mt-2">Supporting</SidebarGroupLabel>
                    )}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => handleNavClick(item)}
                        isActive={currentPage === item.title}
                        className="px-2"
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        {typeof item.icon === 'string' ? (
                          <FontAwesomeIcon
                            name={item.icon as IconName}
                            weight={currentPage === item.title ? 'solid' : 'regular'}
                            className="h-4 w-4 transition-all"
                          />
                        ) : typeof item.icon === 'function' ? (
                          <item.icon />
                        ) : null}
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-[13px] font-medium">
                              {item.title}
                            </span>
                            {item.badge && (
                              <>
                                {item.badge === "New" ? (
                                  <NewBadge />
                                ) : item.badge === "Beta" ? (
                                  <BetaBadge />
                                ) : (
                                  <CountBadge>
                                    {item.badge}
                                  </CountBadge>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {/* Show notification dot when collapsed for items with count badges */}
                        {isCollapsed && item.badge && !isNaN(Number(item.badge)) && (
                          <div className="absolute top-1/2 -translate-y-1/2 -right-1 h-3 w-3 bg-destructive rounded-full" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Projects Section */}
          <NavProjects
            projects={data.projects}
            onItemClick={handleNavClick}
            showNotifications={showNotifications}
            isCollapsed={isCollapsed}
            currentPage={currentPage}
          />

          <SidebarSeparator className="shrink-0 group-data-[collapsible=icon]:hidden" />

          {/* Utility Nav Section — Resources, Settings, Design System */}
          <SidebarGroup>
            <SidebarGroupContent
              className={cn("flex flex-col", isCollapsed ? "px-0" : "px-1.5 md:px-0")}
            >
              {!isCollapsed && (
                <SidebarGroupLabel className="mt-2">Support</SidebarGroupLabel>
              )}
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {/* Resources and Help Collapsible */}
              <Collapsible
                asChild
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={
                        isCollapsed
                          ? "Resources & Help"
                          : undefined
                      }
                      className="px-2"
                    >
                      <FontAwesomeIcon name="circleQuestion" className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className="text-[13px] font-medium">Resources & Help</span>
                      )}
                      {!isCollapsed && (
                        <FontAwesomeIcon name="chevronRight" className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {data.resourcesAndHelp.map((item) => (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton
                              onClick={() =>
                                handleNavClick({
                                  title: item.name,
                                })
                              }
                            >
                              <FontAwesomeIcon
                                name={item.icon as IconName}
                                weight="regular"
                                className="h-4 w-4"
                              />
                              <span className="text-[13px] font-medium">{item.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings */}
              {data.support.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() =>
                      handleNavClick({ title: item.name })
                    }
                    isActive={currentPage === item.name}
                    tooltip={
                      isCollapsed ? item.name : undefined
                    }
                    className="px-2"
                  >
                    <FontAwesomeIcon
                      name={item.icon as IconName}
                      weight={currentPage === item.name ? 'solid' : 'regular'}
                      className="h-4 w-4"
                    />
                    {!isCollapsed && <span className="text-[13px] font-medium">{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={data.user} isCollapsed={isCollapsed} />
        </SidebarFooter>
      </Sidebar>

    </Sidebar>
  );
}