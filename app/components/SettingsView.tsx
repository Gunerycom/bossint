"use client";

import { useState } from "react";
import { useTaskStore } from "./TaskStore";
import { 
  User, 
  Bell, 
  Key, 
  Laptop, 
  CreditCard, 
  Copy, 
  Check, 
  Trash2, 
  Plus,
  Mail,
  Send,
  Link2,
  Shield,
  Activity
} from "lucide-react";

export default function SettingsView() {
  const { tasks } = useTaskStore();
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "notifications" | "api" | "billing">("profile");

  // Mock Form States
  const [name, setName] = useState("Gökhan Günery");
  const [email, setEmail] = useState("gokhan@gunery.com");
  const [avatar, setAvatar] = useState("GG");

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [tgAlerts, setTgAlerts] = useState(false);
  const [webhookAlerts, setWebhookAlerts] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  // API Keys
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key: string; created: string }>>([
    { id: "1", name: "Production API Client", key: "bossint_live_k8f2a93c9d824b01e23", created: "2026-06-20" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Stats for billing
  const totalScans = tasks.reduce((sum, t) => sum + (t.runCount || 0), 0);
  const activeCount = tasks.filter((t) => t.status === "active" || t.status === "running").length;

  const generateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey = {
      id: crypto.randomUUID(),
      name: newKeyName.trim(),
      key: `bossint_live_key_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      created: new Date().toISOString().split("T")[0],
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-fade-in text-[var(--text-primary)]">
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Sub Navigation (1/4) */}
        <div className="md:w-1/4 flex flex-col gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === "profile" 
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]" 
                : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Account</span>
          </button>

          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === "notifications" 
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]" 
                : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Feeds</span>
          </button>

          <button
            onClick={() => setActiveSubTab("api")}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === "api" 
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]" 
                : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Developer API Keys</span>
          </button>

          <button
            onClick={() => setActiveSubTab("billing")}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === "billing" 
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]" 
                : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Quota &amp; Billing</span>
          </button>
        </div>

        {/* Right Settings Area (3/4) */}
        <div className="flex-1 md:max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-6">
          
          {/* PROFILE SECTION */}
          {activeSubTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Profile Settings</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">Manage your account profile metadata credentials.</p>
              </div>

              <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow">
                  {avatar}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)]">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 focus:outline-none"
                      disabled
                    />
                  </div>
                </div>
                <button className="px-4 py-2 text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all rounded-xl shadow-sm cursor-pointer">
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATION FEED SECTION */}
          {activeSubTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Alert Notification Feeds</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">Choose where and how Bossint autopilot pushes intelligence alerts.</p>
              </div>

              <div className="space-y-4">
                {/* Email digests */}
                <div className="flex items-start justify-between p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]/10 rounded-xl">
                  <div className="space-y-1 flex gap-3">
                    <Mail className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Email Digests</p>
                      <p className="text-[10px] text-[var(--text-secondary)] max-w-sm">Receive compiled markdown reports containing daily changes straight to your inbox.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                  />
                </div>

                {/* Telegram notifications */}
                <div className="flex items-start justify-between p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]/10 rounded-xl">
                  <div className="space-y-1 flex gap-3">
                    <Send className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Telegram Push Alerts</p>
                      <p className="text-[10px] text-[var(--text-secondary)] max-w-sm">Routes immediate high-severity anomalies or logs failures to your Telegram webhook bot.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tgAlerts}
                    onChange={(e) => setTgAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                  />
                </div>

                {/* Webhook Digests */}
                <div className="flex flex-col gap-3 p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]/10 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex gap-3">
                      <Link2 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Custom Webhook Receivers</p>
                        <p className="text-[10px] text-[var(--text-secondary)] max-w-sm">Sends POST payload containing the structured report JSON to a custom webhook receiver endpoint.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={webhookAlerts}
                      onChange={(e) => setWebhookAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />
                  </div>

                  {webhookAlerts && (
                    <div className="pt-2 animate-fade-in-up space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Webhook Endpoint URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/v1/bossint-receiver"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <button className="px-4 py-2 text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all rounded-xl shadow-sm cursor-pointer">
                  Save Channels Configuration
                </button>
              </div>
            </div>
          )}

          {/* DEVELOPER API KEYS SECTION */}
          {activeSubTab === "api" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Developer API Keys</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">Generate authentication keys to query and deploy agents programmatically using curl/SDKs.</p>
              </div>

              {/* Form to create new key */}
              <form onSubmit={generateApiKey} className="flex gap-2 items-end border-b border-[var(--border-subtle)] pb-6">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)]">Key Name / Description</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Server SDK Client"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2.5 text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Key</span>
                </button>
              </form>

              {/* API Keys Table */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Keys</h4>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)]/10 rounded-xl border border-[var(--border-color)]">
                    No API keys created. Programmatic triggers will require an authentic token.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {apiKeys.map((key) => {
                      const isCopied = copiedKeyId === key.id;
                      return (
                        <div
                          key={key.id}
                          className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/10 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 truncate">
                            <p className="text-xs font-bold">{key.name}</p>
                            <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate max-w-[280px]">
                              {key.key}
                            </p>
                            <p className="text-[9px] text-[var(--text-tertiary)]">Created: {key.created}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopyKey(key.key, key.id)}
                              className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                              title="Copy Token"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteApiKey(key.id)}
                              className="p-2 rounded-lg border border-red-500/10 text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                              title="Revoke Token"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BILLING & PLAN QUOTA SECTION */}
          {activeSubTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Quota &amp; Billing Limit</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">Review limits on active agents and data scraping quotas.</p>
              </div>

              {/* Plan Card */}
              <div className="p-5 border border-indigo-500/15 bg-indigo-500/5 rounded-2xl relative overflow-hidden space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-500/10 text-[var(--accent)] rounded border border-indigo-500/20">
                      Sandbox Free Demo
                    </span>
                    <h4 className="text-sm font-extrabold">Local Autopilot Account</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
                      Your local-only demo profile uses simulated localStorage memory storage limits.
                    </p>
                  </div>
                  <button className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer transition-all shadow shadow-indigo-500/20">
                    Upgrade Account
                  </button>
                </div>

                {/* Scopes & Status Bars */}
                <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-secondary)]">
                      <span>Active Scheduled Agents</span>
                      <span>{activeCount} / 10 agents</span>
                    </div>
                    <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-[var(--accent)]" style={{ width: `${(activeCount / 10) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-[var(--text-secondary)]">
                      <span>Total Data Scan Runs</span>
                      <span>{totalScans} / 100 scans</span>
                    </div>
                    <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-indigo-500" style={{ width: `${(totalScans / 100) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
