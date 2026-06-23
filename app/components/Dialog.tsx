"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Max-width class, defaults to max-w-[480px] */
  maxWidth?: string;
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "max-w-[480px]",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Dialog Panel */}
      <div
        ref={dialogRef}
        className={`relative w-full ${maxWidth} rounded-2xl overflow-hidden animate-dialog-in`}
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start gap-3 px-6 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
              }}
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer flex-shrink-0"
            style={{
              color: "var(--text-tertiary)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---- Reusable button styles ---- */

interface DialogButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function DialogButton({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  fullWidth = false,
  icon,
}: DialogButtonProps) {
  const getStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--accent)",
          color: "#FFFFFF",
          border: "1px solid var(--accent)",
        };
      case "danger":
        return {
          backgroundColor: "var(--error-bg)",
          color: "var(--error-text)",
          border: "1px solid var(--error-border)",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid transparent",
        };
      default:
        return {
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        };
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""}`}
      style={getStyles()}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon}
      {children}
    </button>
  );
}
