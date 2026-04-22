import * as React from "react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "./utils";
import { Input } from "./input";
import { Button } from "./button";

interface OutlineSearchInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
  /** When true, shows search icon only; expands to full input on click with focus */
  expandable?: boolean;
}

/**
 * Standardized Outline Search Input Component
 * 
 * Features:
 * - Consistent outline variant styling across the app
 * - Built-in search icon positioning
 * - Theme-aware colors using CSS custom properties
 * - Proper focus and hover states
 * - Accessible design with proper ARIA labels
 * - Optional expandable mode: icon-only → expands on click with focus
 */
export function OutlineSearchInput({
  placeholder = "Search...",
  value = "",
  onChange,
  className,
  iconClassName,
  containerClassName,
  expandable = false,
  onBlur: onBlurProp,
  onKeyDown: onKeyDownProp,
  ...props
}: OutlineSearchInputProps) {
  const [isExpanded, setIsExpanded] = React.useState(() => !!(expandable && value && value.trim() !== ""));
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (expandable && isExpanded) {
      const input = containerRef.current?.querySelector("input");
      if (input instanceof HTMLInputElement) input.focus();
    }
  }, [expandable, isExpanded]);

  // Keep expanded when value has content (e.g. from URL or parent state)
  React.useEffect(() => {
    if (expandable && value && value.trim() !== "" && !isExpanded) {
      setIsExpanded(true);
    }
  }, [expandable, value, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    if (!value || value.trim() === "") {
      setIsExpanded(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleCollapse();
    onBlurProp?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (expandable && e.key === "Escape") {
      e.preventDefault();
      setIsExpanded(false);
      (e.target as HTMLInputElement)?.blur();
    }
    onKeyDownProp?.(e as React.KeyboardEvent<HTMLInputElement>);
  };

  if (expandable && !isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleExpand}
        aria-label={placeholder}
      >
        <FontAwesomeIcon name="search" className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", containerClassName)}>
      <FontAwesomeIcon 
        name="search"
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none",
          iconClassName
        )} 
      />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          // Base outline styling - consistent across app
          "pl-9 w-64",
          // Use the shared lighter field border token for interactive controls
          "border-[var(--control-border)] bg-background text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
          "hover:border-ring",
          "transition-colors duration-200",
          expandable && "animate-in fade-in duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}

// Export for convenience
export { OutlineSearchInput as SearchInput };