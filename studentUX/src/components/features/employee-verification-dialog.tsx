"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn, touchTargetMobileClasses } from "../ui/utils";
import type { ScheduleItem } from "../../data/schedule-data";

export interface EmployeeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScheduleItem | null;
  onVerify?: (siteEmail: string) => void;
}

const OTHER_DOMAIN_VALUE = "__other__";

function parseEmail(email: string): { username: string; domain: string } {
  const at = email.indexOf("@");
  if (at === -1) return { username: email, domain: "" };
  return {
    username: email.slice(0, at),
    domain: email.slice(at + 1),
  };
}

/**
 * Dialog to verify employee status by site-issued work email.
 * Opened from the Employee banner inside pay-unlock schedule cards.
 */
export function EmployeeVerificationDialog({
  open,
  onOpenChange,
  item,
  onVerify,
}: EmployeeVerificationDialogProps) {
  const [username, setUsername] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [customDomain, setCustomDomain] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const domainOptions = React.useMemo(() => {
    const domains: string[] = [];
    if (item?.siteEmail) {
      const { domain: d } = parseEmail(item.siteEmail);
      if (d && !domains.includes(d)) domains.push(d);
    }
    domains.push(OTHER_DOMAIN_VALUE);
    return domains;
  }, [item?.siteEmail]);

  React.useEffect(() => {
    if (open && item?.siteEmail) {
      const { username: u, domain: d } = parseEmail(item.siteEmail);
      setUsername(u);
      setDomain(d || "");
      setCustomDomain("");
    } else if (open) {
      setUsername("");
      setDomain("");
      setCustomDomain("");
    }
  }, [open, item?.id, item?.siteEmail]);

  const effectiveDomain = domain === OTHER_DOMAIN_VALUE ? customDomain : domain;
  const siteEmail = username.trim() && effectiveDomain.trim()
    ? `${username.trim()}@${effectiveDomain.trim()}`
    : "";
  const isValid = username.trim() && effectiveDomain.trim();

  const handleVerify = React.useCallback(async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      onVerify?.(siteEmail);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [siteEmail, isValid, onVerify, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(28rem,calc(100%-2rem))]"
        aria-labelledby="employee-verification-title"
        aria-describedby="employee-verification-description"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle
            id="employee-verification-title"
            className="font-display font-bold text-xl text-foreground"
          >
            Employee Verification
          </DialogTitle>
          <DialogDescription
            id="employee-verification-description"
            className="text-[14px] text-foreground"
          >
            Please enter your clinical site issued work email to verify your
            employment status and access simplified onboarding.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex flex-col gap-4 py-2 profile-card-dialog-form"
          role="group"
          aria-labelledby="site-email-label"
        >
          <div className="flex flex-col gap-2">
            <Label id="site-email-label" htmlFor="email-username">
              Site-Issued Email <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email-username"
                type="text"
                placeholder="john.doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                aria-required="true"
                className="profile-dialog-field flex-1 min-w-0"
              />
              <span className="text-muted-foreground shrink-0" aria-hidden>
                @
              </span>
              <Select
                value={domain || undefined}
                onValueChange={(v) => setDomain(v)}
              >
                <SelectTrigger
                  className="profile-dialog-field w-[140px] shrink-0"
                  id="email-domain"
                  aria-label="Email domain"
                  aria-required="true"
                >
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions
                    .filter((d) => d !== OTHER_DOMAIN_VALUE)
                    .map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  <SelectItem value={OTHER_DOMAIN_VALUE}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {domain === OTHER_DOMAIN_VALUE && (
              <Input
                type="text"
                placeholder="Enter domain (e.g. site.org)"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="profile-dialog-field"
                aria-label="Custom email domain"
                aria-required="true"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[14px] text-foreground">Need help?</p>
            <p className="text-xs text-muted-foreground">
              Contact support if your email domain is not listed.
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              You can also proceed with standard onboarding and contact your
              administrator to update your employment status later.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            aria-label="Cancel verification"
            className={cn(touchTargetMobileClasses, "md:min-h-0")}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleVerify}
            disabled={!isValid || isSubmitting}
            aria-label={isSubmitting ? "Verifying employment" : "Verify employment"}
            className={cn(
              "gap-2",
              touchTargetMobileClasses,
              "md:min-h-0"
            )}
          >
            <FontAwesomeIcon
              name="userCheck"
              className="h-4 w-4"
              weight="light"
              aria-hidden
            />
            {isSubmitting ? "Verifying…" : "Verify Employment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
