"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  modifiersClassNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="after"
      className={cn("p-3", className)}
      modifiersClassNames={{
        selected: "!rounded-full bg-primary text-primary-foreground",
        today: "!rounded-full bg-accent text-accent-foreground",
        ...modifiersClassNames,
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2 w-full",
        month: "flex flex-col gap-4 w-full min-w-[252px]",
        caption: "flex justify-between items-center pt-1 px-1 w-full min-w-full gap-3",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-2 shrink-0",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "!rounded-full aspect-square size-9 md:size-8 shrink-0 bg-transparent p-0 opacity-50 hover:opacity-100 touch-manipulation",
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-9 min-w-9 font-normal text-xs flex-1 text-center",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm flex-1 min-w-9 flex items-center justify-center focus-within:relative focus-within:z-20",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "!rounded-full aspect-square size-9 md:size-8 p-0 font-normal aria-selected:opacity-100 touch-manipulation",
        ),
        day_range_start:
          "day-range-start rounded-l-full aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end rounded-r-full aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "rounded-full bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className }) => (
          <ChevronLeft className={cn("size-4", className)} />
        ),
        IconRight: ({ className }) => (
          <ChevronRight className={cn("size-4", className)} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
