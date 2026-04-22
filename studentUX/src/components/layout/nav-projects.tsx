"use client";

import * as React from "react";
import { type IconName } from "../brand/font-awesome-icon";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { CountText } from "../ui/badge";
import { Separator } from "../ui/separator";

interface Project {
  name: string;
  url: string;
  icon: IconName;
  hasNewRequests?: boolean;
  newRequestCount?: number;
}

interface NavProjectsProps {
  projects: Project[];
  onItemClick: (item: { title: string }) => void;
  currentPage?: string;
}

export function NavProjects({
  projects,
  onItemClick,
  currentPage,
}: NavProjectsProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Hide this section - return null
  return null;
}
