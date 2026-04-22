import React from "react";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "./font-awesome-icon";

interface DashboardProps {
  userName: string;
  email: string;
  onLogout: () => void;
}

export const Dashboard = ({ userName, email, onLogout }: DashboardProps) => {
  return (
    <div className="relative w-full h-full flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                <FontAwesomeIcon name="user" className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {userName || "User"}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {email}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-[40px] rounded-xl px-4 gap-2"
            onClick={onLogout}
          >
            <FontAwesomeIcon name="lock" className="text-muted-foreground" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-6 py-12">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full flex items-center justify-center">
            <FontAwesomeIcon name="home" className="text-4xl text-primary" />
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-[48px] font-bold text-foreground">
              Welcome to your Dashboard
            </h1>
            <p className="text-[18px] text-muted-foreground max-w-[600px]">
              This is your personal workspace. Start exploring opportunities, manage your profile, and connect with the community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 items-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="briefcase" className="text-2xl text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Find Opportunities
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  Discover jobs and placements tailored to your profile
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 items-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="user" className="text-2xl text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Manage Profile
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  Update your information and preferences
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 items-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon name="star" className="text-2xl text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Get Started
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  Complete your profile to unlock all features
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-center px-6">
          <p className="text-[12px] text-muted-foreground">
            <span className="text-foreground font-medium">Need Assistance? </span>
            <a href="#" className="text-foreground underline font-medium">
              Contact Us
            </a>
            <span className="mx-2">•</span>
            <span>©2025 Exxat, Inc.</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
