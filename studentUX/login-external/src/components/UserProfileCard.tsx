import React from "react";
import { Button } from "./ui/button";

interface UserProfileCardProps {
  name: string;
  email: string;
  onSignOut: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  email,
  onSignOut,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 rounded-lg bg-gray-50/50">
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-foreground font-semibold text-[16px] leading-tight">
          {name}
        </span>
        <span className="text-muted-foreground text-[14px] leading-tight">
          {email}
        </span>
      </div>
      <Button
        onClick={onSignOut}
        variant="ghost"
        className="h-auto px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground shrink-0"
      >
        Sign Out
      </Button>
    </div>
  );
};