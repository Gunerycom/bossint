"use client";

import { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import TopBar from "./TopBar";
import LandingPage from "./LandingPage";
import TemplateDeployDialog from "./TemplateDeployDialog";
import CreateTaskDialog from "./CreateTaskDialog";
import OnboardingFlow from "./OnboardingFlow";
import { useTaskStore } from "./TaskStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const {
    isDeployOpen,
    setIsDeployOpen,
    deployTemplate,
    isCreateTaskOpen,
    setIsCreateTaskOpen,
    hasCompletedOnboarding,
  } = useTaskStore();

  useEffect(() => {
    // Check if the user is logged in
    const auth = localStorage.getItem("bossint_auth");
    setIsAuthenticated(auth === "true");
  }, []);

  // Listen for storage changes (to support logout from other tabs or components)
  useEffect(() => {
    const handleStorageChange = () => {
      const auth = localStorage.getItem("bossint_auth");
      setIsAuthenticated(auth === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event listener for local logouts in the same window
    window.addEventListener("bossint_auth_change", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bossint_auth_change", handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    // Beautiful loading splash matching the warm cream theme
    return (
      <div className="h-screen w-screen bg-[#FBF9F6] flex flex-col items-center justify-center font-sans">
        <div className="flex items-center gap-2.5 mb-4">
          <video
            src="/bossint-logo-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-auto object-contain"
            style={{ height: "72px" }}
          />
          <span className="font-bold text-2xl tracking-tight text-neutral-900">Bossint</span>
        </div>
        <div className="w-16 h-0.5 bg-neutral-200 overflow-hidden rounded-full relative">
          <div className="absolute top-0 left-0 bottom-0 bg-indigo-600 w-[50%] rounded-full animate-shimmer"></div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { left: -50%; }
            100% { left: 100%; }
          }
          .animate-shimmer {
            animation: shimmer 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg-primary)] animate-fade-in">
      {/* Persistent Left Sidebar */}
      <LeftSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar setIsMobileOpen={setIsMobileOpen} />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      {/* Global Template Deploy Dialog */}
      <TemplateDeployDialog
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        template={deployTemplate}
      />

      {/* Global Task Creation Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      {/* Onboarding Flow Overlay */}
      {!hasCompletedOnboarding && <OnboardingFlow />}
    </div>
  );
}
