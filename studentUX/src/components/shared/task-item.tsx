"use client";

import { Check } from "lucide-react";
import { cn } from "@/components/ui/utils";

type TaskItemProps = {
  label: string;
  completed?: boolean;
  onClick?: () => void;
};

export function TaskItem({ label, completed = false, onClick }: TaskItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "flex w-full items-center gap-3 cursor-pointer px-2 py-2.5 text-left text-sm transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        completed ? "bg-muted/30" : "hover:bg-muted/50"
      )}
    >
      {/* Circle */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          completed && "bg-chart-2 border-chart-2 text-primary-foreground"
        )}
      >
        {completed && <Check className="h-3 w-3" />}
      </div>

      {/* Text */}
      <span
        className={cn(
          "text-sm transition-all",
          completed && "text-muted-foreground"
        )}
        style={completed ? { textDecoration: "line-through" } : undefined}
      >
        {label}
      </span>
    </div>
  );
}
