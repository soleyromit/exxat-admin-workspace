"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk@1.1.1";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export interface SearchableSelectProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Shown when popover is open. Default: "Search..." */
  searchPlaceholder?: string;
  /** Use when options.length >= 10. Renders search input. */
  className?: string;
  /** Accessible label for the trigger (required for icon-only or when placeholder is generic) */
  "aria-label"?: string;
  /** Whether the field is required (for aria-required) */
  required?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  "aria-label": ariaLabel,
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerLabel = ariaLabel ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={triggerLabel}
          aria-required={required}
          className={cn(
            "w-full justify-between font-normal [&_svg]:text-muted-foreground [height:var(--control-height)] [padding-block:var(--control-padding-y)]",
            !value && "text-muted-foreground",
            className
          )}
          style={{ borderColor: "var(--control-border)" }}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <FontAwesomeIcon
            name="chevronDown"
            className="size-4 shrink-0 opacity-50"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <CommandPrimitive
          className="flex h-full w-full flex-col overflow-hidden rounded-md"
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <FontAwesomeIcon name="search" className="size-4 shrink-0 opacity-50" aria-hidden />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={searchPlaceholder}
            />
          </div>
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-1">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </CommandPrimitive.Empty>
            {options.map((opt) => (
              <CommandPrimitive.Item
                key={opt}
                value={opt}
                onSelect={() => {
                  onValueChange(opt);
                  setOpen(false);
                }}
                className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
              >
                {opt}
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
