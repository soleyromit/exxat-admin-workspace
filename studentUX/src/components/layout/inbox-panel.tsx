"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { OutlineSearchInput } from "../ui/outline-search-input";
import { cn } from "../ui/utils";

const INBOX_DATA = [
  { id: "1", name: "Jordan Lee", title: "New Slot Request", message: "Jordan Lee has submitted a new slot request for the upcoming term. Review and approve to confirm placement.", type: "request", icon: "alertCircle" as IconName, time: "2 minutes ago", isRead: false },
  { id: "2", name: "Sam Rivera", title: "Schedule Approved", message: "The schedule for Sam Rivera has been approved by the site coordinator. Confirmation sent.", type: "success", icon: "checkCircle" as IconName, time: "1 hour ago", isRead: false },
  { id: "3", name: "Westside Center", title: "Capacity Updated", message: "Westside Center has updated available slots for the upcoming term. 5 new positions are now open.", type: "info", icon: "circleInfo" as IconName, time: "3 hours ago", isRead: false },
  { id: "4", name: "Casey Kim", title: "Slot Request Cancelled", message: "Casey Kim has cancelled their slot request due to a schedule conflict. The slot has been freed.", type: "warning", icon: "alertCircle" as IconName, time: "5 hours ago", isRead: true },
  { id: "5", name: "Dr. R. Patel", title: "Evaluation Submitted", message: "Dr. R. Patel has submitted the mid-term evaluation. Review results in the compliance dashboard.", type: "success", icon: "fileBarChart" as IconName, time: "8 hours ago", isRead: false },
  { id: "6", name: "System Alert", title: "Document Upload Required", message: "Morgan Chen needs to upload required documents before the assignment start date.", type: "warning", icon: "upload" as IconName, time: "12 hours ago", isRead: false },
  { id: "7", name: "Taylor Brooks", title: "Placement Confirmed", message: "Placement confirmed for Taylor Brooks at Northern Site from 03/15 to 04/30.", type: "success", icon: "checkCircle" as IconName, time: "Yesterday", isRead: true },
  { id: "8", name: "Northern Site", title: "Requirements Updated", message: "Northern Site has updated their onboarding requirements. Review before assigning new placements.", type: "info", icon: "shield" as IconName, time: "Yesterday", isRead: false },
  { id: "9", name: "Dr. M. Santos", title: "Reference Submitted", message: "Dr. M. Santos has submitted a reference letter. It's now available in the student record.", type: "success", icon: "star" as IconName, time: "2 days ago", isRead: true },
  { id: "10", name: "Eastside Academy", title: "New Partnership", message: "Eastside Academy has joined the network with 20 placements available for the next cycle.", type: "success", icon: "graduation-cap" as IconName, time: "2 days ago", isRead: false },
  { id: "11", name: "Riley Thompson", title: "Attendance Alert", message: "Riley Thompson has exceeded the allowed absence threshold for the current term.", type: "warning", icon: "alertTriangle" as IconName, time: "3 days ago", isRead: true },
  { id: "12", name: "Admin Team", title: "Orientation Scheduled", message: "Orientation is scheduled for 03/10 at 9:00 AM for all participants starting new placements.", type: "info", icon: "calendar" as IconName, time: "3 days ago", isRead: false },
  { id: "13", name: "Dana Wright", title: "Assignment Completed", message: "Dana Wright has successfully completed the assignment with excellent performance ratings.", type: "success", icon: "award" as IconName, time: "4 days ago", isRead: true },
  { id: "14", name: "Dr. A. Foster", title: "Mentor Application", message: "Dr. A. Foster has applied to become a mentor. Review their profile and credentials.", type: "request", icon: "userPlus" as IconName, time: "5 days ago", isRead: false },
  { id: "15", name: "System Update", title: "Integration Complete", message: "The billing integration is now live. Fees will be processed automatically going forward.", type: "success", icon: "creditCard" as IconName, time: "5 days ago", isRead: true },
  { id: "16", name: "Southern Hub", title: "Capacity Expanded", message: "Southern Hub has expanded capacity and can now accept 10 additional placements per term.", type: "info", icon: "trendingUp" as IconName, time: "1 week ago", isRead: false },
  { id: "17", name: "Jamie Clark", title: "Extension Request", message: "Jamie Clark has requested a 2-week extension for the current assignment.", type: "request", icon: "timer" as IconName, time: "1 week ago", isRead: true },
  { id: "18", name: "Compliance Team", title: "Monthly Audit Complete", message: "Monthly compliance audit completed. All sites are meeting standards with a 98% pass rate.", type: "success", icon: "clipboard" as IconName, time: "1 week ago", isRead: true },
  { id: "19", name: "Western Institute", title: "New Program Launch", message: "Western Institute is launching a new specialty program starting next semester. Applications open.", type: "info", icon: "zap" as IconName, time: "2 weeks ago", isRead: false },
  { id: "20", name: "System Alert", title: "Maintenance Scheduled", message: "System maintenance is scheduled this weekend from 2 AM to 6 AM. Plan accordingly.", type: "info", icon: "settings-2" as IconName, time: "2 weeks ago", isRead: true },
];

function getNotificationColor(type: string) {
  switch (type) {
    case "success": return "text-chart-1";
    case "warning": return "text-chart-4";
    case "request": return "text-chart-2";
    default: return "text-muted-foreground";
  }
}

export interface InboxPanelProps {
  onClose: () => void;
  onNavigationChange?: (page: string) => void;
}

export function InboxPanel({ onClose, onNavigationChange }: InboxPanelProps) {
  const [notifications, setNotifications] = React.useState(INBOX_DATA);
  const [showUnreadsOnly, setShowUnreadsOnly] = React.useState(false);
  const [notificationFilter, setNotificationFilter] = React.useState<"all" | "updates" | "messages">("all");

  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;
    if (showUnreadsOnly) filtered = filtered.filter((n) => !n.isRead);
    if (notificationFilter === "updates") filtered = filtered.filter((n) => n.type === "success" || n.type === "info");
    else if (notificationFilter === "messages") filtered = filtered.filter((n) => n.type === "request" || n.type === "warning");
    return filtered;
  }, [notifications, showUnreadsOnly, notificationFilter]);

  const handleClose = () => {
    onClose();
    onNavigationChange?.("Home");
  };

  return (
    <div className="hidden md:flex w-[320px] shrink-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground">
      {/* Fixed header with title, separator, chips row, search */}
      <header className="flex shrink-0 flex-col border-b border-border bg-sidebar">
        <div className="flex w-full min-w-0 items-center justify-between gap-2 px-4 py-3">
          <h2 className="min-w-0 flex-1 text-sm font-medium text-foreground">Inbox</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 shrink-0 p-0" aria-label="Close inbox">
                <FontAwesomeIcon name="x" className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close inbox</TooltipContent>
          </Tooltip>
        </div>
        <div className="h-px shrink-0 bg-border" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <Button size="sm" variant={notificationFilter === "all" ? "default" : "outline"} className="h-7 shrink-0 px-3 text-xs" onClick={() => setNotificationFilter("all")}>All</Button>
          <Button size="sm" variant={notificationFilter === "updates" ? "default" : "outline"} className="h-7 shrink-0 px-3 text-xs" onClick={() => setNotificationFilter("updates")}>Updates</Button>
          <Button size="sm" variant={notificationFilter === "messages" ? "default" : "outline"} className="h-7 shrink-0 px-3 text-xs" onClick={() => setNotificationFilter("messages")}>Messages</Button>
          <Button size="sm" variant={showUnreadsOnly ? "default" : "outline"} className="h-7 shrink-0 px-3 text-xs" onClick={() => setShowUnreadsOnly(!showUnreadsOnly)}>Unread</Button>
        </div>
        <div className="px-4 pb-3">
          <OutlineSearchInput placeholder="Search inbox..." className="h-8 w-full" />
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex flex-col items-start gap-2 border-b border-border px-4 py-4 leading-tight last:border-b-0",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors",
                !notification.isRead && "bg-chart-1/10"
              )}
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
                )
              }
            >
              <div className="flex w-full items-center gap-2">
                <FontAwesomeIcon name={notification.icon} className={cn("h-4 w-4", getNotificationColor(notification.type))} />
                <span className="font-medium">{notification.name}</span>
                {!notification.isRead && <div className="ml-auto h-2 w-2 bg-chart-1 rounded-full" />}
                <span className="ml-auto text-muted-foreground">{notification.time}</span>
              </div>
              <span className="font-medium">{notification.title}</span>
              <span className="line-clamp-3 w-[280px] text-muted-foreground whitespace-break-spaces">{notification.message}</span>
            </div>
          ))}
          {filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FontAwesomeIcon name="bell" className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {showUnreadsOnly ? "No unread notifications" : "No notifications"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
