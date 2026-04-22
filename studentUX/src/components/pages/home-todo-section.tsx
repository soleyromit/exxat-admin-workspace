"use client";

import * as React from "react";
import { TodoCardList } from "../shared/todo-task-card";
import { useAppStore } from "../../stores/app-store";
import { useProfileStore } from "../../stores/profile-store";
import { SectionWithHeader } from "../shared/section-with-header";
import { mockTodoTasks } from "../../data/todo-data";
import type { TodoTask } from "../shared/todo-task-card";

export function HomeTodoSection() {
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const setProfileSettingsOpen = useAppStore((s) => s.setProfileSettingsOpen);
  const addSecondaryEmail = useProfileStore((s) => s.addSecondaryEmail);

  const handleTaskAction = React.useCallback(
    (task: TodoTask, action: "primary" | "viewInstructions" | "sharePreferences") => {
      if (task.taskType === "Account Settings" && action === "primary") {
        setProfileSettingsOpen(true);
      } else if (action === "primary" && task.siteName) {
        navigateToPage("Schedules", { scheduleTab: "schedule" });
      } else if (action === "viewInstructions" || action === "sharePreferences") {
        navigateToPage("Schedules", { scheduleTab: "schedule" });
      }
    },
    [navigateToPage, setProfileSettingsOpen]
  );

  return (
    <SectionWithHeader
      title="To Do"
      description="Tasks and actions that need your attention"
      titleId="section-todo"
      className="!px-0"
    >
      <TodoCardList
        tasks={mockTodoTasks}
        onTaskAction={handleTaskAction}
        onAddSecondaryEmail={addSecondaryEmail}
      />
    </SectionWithHeader>
  );
}
