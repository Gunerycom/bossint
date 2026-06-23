"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore } from "./TaskStore";
import { Menu, RefreshCw, Share2, Trash2, User, ChevronLeft, LogOut } from "lucide-react";

interface TopBarProps {
  setIsMobileOpen: (val: boolean) => void;
}

export default function TopBar({ setIsMobileOpen }: TopBarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem("bossint_user_email"));
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bossint_auth");
    localStorage.removeItem("bossint_user_email");
    window.dispatchEvent(new Event("bossint_auth_change"));
  };

  const {
    currentView,
    setView,
    activeConversationId,
    conversations,
    deleteConversation,
    syncTasks,
    tasks,
  } = useTaskStore();

  // Find active conversation title
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  
  let title = "General Autopilot";
  if (currentView === "chat" && activeConv) {
    title = activeConv.title;
  } else if (currentView === "explore") {
    title = "Explore Templates";
  } else if (currentView === "dashboard") {
    title = "Agent Operations Dashboard";
  } else if (currentView === "agent-detail") {
    title = "Agent Analytics";
  }

  const handleClearChat = () => {
    if (activeConversationId) {
      deleteConversation(activeConversationId);
    }
  };

  const activeCount = tasks.filter(
    (t) => t.status === "active" || t.status === "running"
  ).length;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-md flex items-center justify-between px-4">
      {/* Left side: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {currentView === "agent-detail" && (
          <button
            onClick={() => setView("dashboard")}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mr-1 flex items-center justify-center cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}

        <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-sm">
          {title}
        </h1>
      </div>

      {/* Right side: Contextual Actions */}
      <div className="flex items-center gap-2">
        {currentView === "chat" && activeConversationId && (
          <>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </>
        )}

        {currentView === "dashboard" && (
          <button
            onClick={syncTasks}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Synchronize tasks"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Sync Agents</span>
          </button>
        )}

        {/* Global User / Profile status indicator */}
        <div className="h-8 w-px bg-[var(--border-color)] mx-1" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs font-medium outline-none"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
              {userEmail === "gokhan@gunery.com" ? "GG" : "GU"}
            </div>
            <span className="hidden sm:inline text-[var(--text-primary)]">
              {userEmail === "gokhan@gunery.com" ? "Gökhan Günery" : "Guest User"}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg py-1 z-50 animate-dialog-in text-xs">
              <div className="px-3 py-2 border-b border-[var(--border-color)] text-[var(--text-tertiary)] truncate">
                {userEmail || "guest@bossint.com"}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-500 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
