"use client";

import { useTheme } from "./ThemeProvider";

export default function EmptyState() {
  const { theme } = useTheme();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Full Logo */}
      <img
        src="/bossint-text-logo.png"
        alt="Bossint"
        className="h-10 mb-3 select-none"
        style={{
          filter: theme === "dark" ? "invert(1)" : "none",
        }}
      />

      {/* Tagline */}
      <p
        className="text-base mb-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        Your intelligent research assistant
      </p>
    </div>
  );
}
