"use client";

import * as React from "react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "./utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
      onChange?.(event);
    };

    const handleVisualClick = () => {
      if (inputRef.current && !props.disabled) {
        inputRef.current.click();
        inputRef.current.focus();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleVisualClick();
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          role="checkbox"
          aria-checked={checked}
          tabIndex={props.disabled ? -1 : 0}
          onClick={handleVisualClick}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base — 18px square, 1px border, subtle 3px radius = clearly a checkbox
            "h-[18px] w-[18px] shrink-0 rounded-sm border bg-background",
            "transition-all duration-150 cursor-pointer select-none flex items-center justify-center",
            // Border color — design system control border
            "border-[var(--control-border)]",
            // Focus ring
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            // Checked state
            "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground",
            checked && "bg-primary border-primary text-primary-foreground",
            // Hover
            !checked && "hover:border-[var(--control-border)]",
            checked && "hover:bg-primary/90 hover:border-primary/90",
            // Disabled
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            props.disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <FontAwesomeIcon 
            name="check"
            className={cn(
              "h-3.5 w-3.5 text-current transition-opacity duration-150 pointer-events-none",
              checked ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
