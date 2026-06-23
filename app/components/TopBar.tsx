"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTaskStore } from "./TaskStore";
import type { Task } from "../lib/taskTypes";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  RefreshCw, 
  Share2, 
  Trash2, 
  ChevronLeft, 
  LogOut, 
  Bell, 
  Search, 
  X,
  PlusCircle,
  LayoutDashboard,
  Compass,
  Settings as SettingsIcon,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles
} from "lucide-react";
import { TEMPLATES, AgentTemplate } from "../lib/templateData";

interface TopBarProps {
  setIsMobileOpen: (val: boolean) => void;
}

export default function TopBar({ setIsMobileOpen }: TopBarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications and search states
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    currentView,
    setView,
    activeConversationId,
    conversations,
    deleteConversation,
    syncTasks,
    tasks,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSelectedAgentId,
    setIsCreateTaskOpen,
    setCreateTaskPrefills,
  } = useTaskStore();
  const router = useRouter();

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

  // Keyboard shortcut listener for Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bossint_auth");
    localStorage.removeItem("bossint_user_email");
    window.dispatchEvent(new Event("bossint_auth_change"));
  };

  // Find active conversation title
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleConvertToAgent = () => {
    if (!activeConv) return;
    const userMsgs = activeConv.messages.filter((m) => m.role === "user");
    const firstPrompt = userMsgs.length > 0 ? userMsgs[0].content : "";
    setCreateTaskPrefills({
      title: activeConv.title.replace(/\.\.\.$/, ""),
      prompt: firstPrompt,
    });
    setIsCreateTaskOpen(true);
  };
  
  let title = "General Autopilot";
  if (currentView === "chat") {
    title = activeConv ? activeConv.title : "New Research";
  } else if (currentView === "explore") {
    title = "Explore Presets";
  } else if (currentView === "dashboard") {
    title = "Command Center";
  } else if (currentView === "agent-detail") {
    title = "Agent Analytics";
  } else if (currentView === "settings") {
    title = "System Settings & Integrations";
  }

  const handleClearChat = () => {
    if (activeConversationId) {
      deleteConversation(activeConversationId);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { agents: [], blueprints: [], commands: [] };

    const q = searchQuery.toLowerCase();

    // 1. Match active agents
    const matchedAgents = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        (t.target && t.target.toLowerCase().includes(q))
    ).slice(0, 3);

    // 2. Match blueprints templates
    const matchedBlueprints = TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    ).slice(0, 4);

    // 3. Match quick commands
    const allCommands = [
      { label: "Go to Command Center (Dashboard)", action: () => router.push("/dashboard"), icon: LayoutDashboard },
      { label: "Open Research Chat", action: () => router.push("/chat"), icon: PlusCircle },
      { label: "Browse Preset Blueprints", action: () => router.push("/explore"), icon: Compass },
      { label: "Open System Settings", action: () => router.push("/settings"), icon: SettingsIcon },
      { label: "Sign Out of Bossint", action: handleLogout, icon: LogOut },
    ];
    const matchedCommands = allCommands.filter((c) =>
      c.label.toLowerCase().includes(q)
    );

    return {
      agents: matchedAgents,
      blueprints: matchedBlueprints,
      commands: matchedCommands,
    };
  }, [searchQuery, tasks, router]);

  const handleSelectAgent = (id: string) => {
    router.push(`/agents/${id}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectBlueprint = () => {
    router.push("/explore");
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectCommand = (action: () => void) => {
    action();
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Helper for notification colors
  const getNotifIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "milestone":
        return <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />;
      default:
        return <Activity className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-md flex items-center justify-between px-4 text-[var(--text-primary)] transition-colors duration-300">
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
              onClick={() => router.push("/dashboard")}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mr-1 flex items-center justify-center cursor-pointer"
              title="Back to Command Center"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}

          <h1 className="text-sm font-semibold tracking-tight truncate max-w-[160px] sm:max-w-sm">
            {title}
          </h1>
        </div>

        {/* Right side: Contextual Actions */}
        <div className="flex items-center gap-2">
          
          {/* Global Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer text-xs text-[var(--text-secondary)]"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-semibold">Search...</span>
            <kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1 font-mono text-[9px] font-medium text-[var(--text-tertiary)] opacity-100">
              <span className="text-[8px]">⌘</span>K
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotifPanelOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative cursor-pointer"
            title="Notifications feed"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[var(--accent)] text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {currentView === "chat" && activeConversationId && activeConv && activeConv.messages.length > 0 && (
            <button
              onClick={handleConvertToAgent}
              className="p-2 rounded-lg hover:bg-indigo-500/10 text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Deploy this research chat session as a background monitoring agent"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" strokeWidth={2} />
              <span className="hidden sm:inline">⚡ Convert to Agent</span>
            </button>
          )}

          {currentView === "chat" && activeConversationId && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Delete</span>
            </button>
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

          <div className="h-8 w-px bg-[var(--border-color)] mx-1" />

          {/* User Profile Dropdown */}
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
                  onClick={() => {
                    router.push("/settings");
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-500 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer font-medium border-t border-[var(--border-color)]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Slide Panel */}
      {isNotifPanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsNotifPanelOpen(false)} 
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-80 bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-slide-in-right text-[var(--text-primary)]">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--accent)]" />
                <span>Notifications</span>
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={markAllNotificationsAsRead} 
                  className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer font-semibold"
                >
                  Mark all read
                </button>
                <button 
                  onClick={() => setIsNotifPanelOpen(false)} 
                  className="p-1 hover:bg-[var(--bg-surface-hover)] rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-tertiary)] text-xs">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.agentId) {
                        handleSelectAgent(notif.agentId);
                      }
                      markNotificationAsRead(notif.id);
                      setIsNotifPanelOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer hover:bg-[var(--bg-surface-hover)] relative transition-all flex gap-3 ${
                      notif.read 
                        ? "bg-[var(--bg-primary)]/20 border-[var(--border-color)]" 
                        : "bg-[var(--accent-subtle)]/30 border-[var(--accent)]/15 font-medium"
                    }`}
                  >
                    {getNotifIcon(notif.type)}
                    <div className="space-y-1">
                      <p className="text-[var(--text-primary)] line-clamp-1 pr-4">{notif.title}</p>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed line-clamp-2">{notif.message}</p>
                      <span className="text-[9px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!notif.read && (
                      <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Unified Global Search Overlay */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-start justify-center pt-20 px-4 transition-all"
          onClick={() => {
            setIsSearchOpen(false);
            setSearchQuery("");
          }}
        >
          <div 
            className="max-w-lg w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-4 space-y-4 animate-dialog-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active agents, blueprints, commands..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                autoFocus
              />
            </div>

            {/* Conditional Result list */}
            {searchQuery.trim() ? (
              <div className="max-h-72 overflow-y-auto space-y-4 text-xs pr-1">
                
                {/* 1. Deployed Agents */}
                {searchResults.agents.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Agents</h4>
                    <div className="space-y-1">
                      {searchResults.agents.map((agent: Task) => (
                        <div
                          key={agent.id}
                          onClick={() => handleSelectAgent(agent.id)}
                          className="p-2 rounded-lg bg-[var(--bg-primary)]/20 hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="font-semibold">{agent.title}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)]">Interval: {agent.schedule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Blueprints */}
                {searchResults.blueprints.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Blueprints Presets</h4>
                    <div className="space-y-1">
                      {searchResults.blueprints.map((bp: AgentTemplate) => (
                        <div
                          key={bp.id}
                          onClick={handleSelectBlueprint}
                          className="p-2 rounded-lg bg-[var(--bg-primary)]/20 hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="font-semibold">{bp.title}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">{bp.description}</p>
                          </div>
                          <PlusCircle className="w-4 h-4 text-[var(--accent)] shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Navigation Commands */}
                {searchResults.commands.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Quick Commands</h4>
                    <div className="space-y-1">
                      {searchResults.commands.map((cmd: { label: string; action: () => void; icon: any }, idx: number) => {
                        const CmdIcon = cmd.icon;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectCommand(cmd.action)}
                            className="p-2 rounded-lg bg-[var(--bg-primary)]/20 hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] cursor-pointer flex items-center gap-2 transition-colors"
                          >
                            <CmdIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                            <span className="font-semibold">{cmd.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.agents.length === 0 && 
                 searchResults.blueprints.length === 0 && 
                 searchResults.commands.length === 0 && (
                  <div className="text-center py-6 text-[var(--text-tertiary)] text-xs">
                    No results match your search query.
                  </div>
                )}

              </div>
            ) : (
              <div className="text-[10px] text-[var(--text-tertiary)] text-center py-4 border-t border-[var(--border-subtle)]">
                Type query above. Press <kbd className="px-1 py-0.5 rounded border border-[var(--border-color)] font-mono">Esc</kbd> to close.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
