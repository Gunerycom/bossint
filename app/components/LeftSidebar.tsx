"use client";

import { useTheme } from "./ThemeProvider";
import { useTaskStore } from "./TaskStore";
import { useRouter } from "next/navigation";
import {
  Plus,
  Compass,
  LayoutDashboard,
  Cpu,
  Settings,
  HelpCircle,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface LeftSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function LeftSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: LeftSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const {
    currentView,
    conversations,
    activeConversationId,
    deleteConversation,
  } = useTaskStore();
  const router = useRouter();

  const handleNewResearch = () => {
    router.push("/chat");
    setIsMobileOpen(false);
  };


  const selectConversation = (id: string) => {
    router.push(`/chat/${id}`);
    setIsMobileOpen(false);
  };

  const handleNavClick = (view: "welcome" | "hub" | "explore" | "dashboard" | "settings") => {
    if (view === "welcome") {
      router.push("/");
    } else {
      router.push(`/${view}`);
    }
    setIsMobileOpen(false);
  };

  const renderNavItems = () => {
    const items = [
      { id: "welcome", label: "Create Agent", icon: Sparkles, action: () => handleNavClick("welcome") },
      { id: "hub", label: "My Hub", icon: Cpu, action: () => handleNavClick("hub") },
      { id: "chat", label: "Research Chat", icon: Plus, action: handleNewResearch },
      { id: "explore", label: "Agent Library", icon: Compass, action: () => handleNavClick("explore") },
      { id: "dashboard", label: "My Agents", icon: LayoutDashboard, action: () => handleNavClick("dashboard") },
    ] as const;

    return (
      <div className="space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "chat"
              ? currentView === "chat" && !activeConversationId
              : currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--bg-surface-hover)] text-[var(--accent)] border-l-2 border-[var(--accent)] rounded-l-none"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  // Group conversations by time periods (Today, Yesterday, Last 7 Days, Older)
  const getGroupedConversations = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const today: typeof conversations = [];
    const yesterday: typeof conversations = [];
    const last7Days: typeof conversations = [];
    const older: typeof conversations = [];

    conversations.forEach((conv) => {
      const diff = now - conv.timestamp;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < 2 * oneDay) {
        yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "Last 7 Days", items: last7Days },
      { title: "Older", items: older },
    ].filter((group) => group.items.length > 0);
  };

  const groupedConvs = getGroupedConversations();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r bg-[var(--bg-surface)] border-[var(--border-color)] transition-all duration-300 lg:static lg:z-auto ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-[68px]" : "w-[260px]"}`}
      >
        {/* Top Header & Collapse toggle */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-color)]">
          {!isCollapsed && (
            <div className="flex items-center cursor-pointer" onClick={() => handleNavClick("welcome")}>
              <video
                src="/bossint-logo-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-12 object-contain"
              />
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto cursor-pointer" onClick={() => handleNavClick("welcome")}>
              <video
                src="/bossint-logo-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-12 h-12 object-contain"
              />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Primary CTAs */}
        <div className="py-4 border-b border-[var(--border-color)]">
          {renderNavItems()}
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {!isCollapsed && conversations.length > 0 && (
            <div className="space-y-4 px-2">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2">
                Recent Research
              </h3>
              
              {groupedConvs.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="text-[10px] font-medium text-[var(--text-tertiary)] px-2 pt-1">
                    {group.title}
                  </div>
                  {group.items.map((conv) => {
                    const isActive = activeConversationId === conv.id && currentView === "chat";
                    return (
                      <div
                        key={conv.id}
                        className={`group relative flex items-center rounded-lg text-sm transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[var(--bg-surface-hover)] text-[var(--accent)] font-medium"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <button
                          onClick={() => selectConversation(conv.id)}
                          className="flex-1 flex items-center gap-2.5 px-2 py-2 text-left min-w-0"
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                          <span className="truncate pr-6">{conv.title}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-tertiary)] hover:text-red-500 transition-opacity transition-colors"
                          title="Delete Research"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {isCollapsed && conversations.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              {conversations.slice(0, 10).map((conv) => {
                const isActive = activeConversationId === conv.id && currentView === "chat";
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--bg-surface-hover)] text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                    }`}
                    title={conv.title}
                  >
                    <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Pinned Footer */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex flex-col gap-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  {!isCollapsed && <span className="truncate">Dark Mode</span>}
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  {!isCollapsed && <span className="truncate">Light Mode</span>}
                </>
              )}
            </button>

            {/* Help */}
            <button
              onClick={() => handleNavClick("welcome")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              {!isCollapsed && <span className="truncate">Help & Guide</span>}
            </button>

            {/* Settings */}
            <button
              onClick={() => handleNavClick("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentView === "settings"
                  ? "bg-[var(--bg-surface-hover)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              {!isCollapsed && <span className="truncate">Settings</span>}
            </button>

            {/* Sign Out */}
            <button
              onClick={() => {
                localStorage.removeItem("bossint_auth");
                localStorage.removeItem("bossint_user_email");
                localStorage.removeItem("bossint_user_token");
                window.dispatchEvent(new Event("bossint_auth_change"));
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              {!isCollapsed && <span className="truncate">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
