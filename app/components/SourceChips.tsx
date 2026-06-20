"use client";

interface Source {
  url: string;
  title?: string;
}

interface SourceChipsProps {
  sources: Source[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch {
    return "";
  }
}

export default function SourceChips({ sources }: SourceChipsProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <span
        className="text-xs font-medium self-center mr-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        Sources
      </span>
      {sources.map((source, idx) => (
        <a
          key={idx}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-150 no-underline"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-surface)";
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFaviconUrl(source.url)}
            alt=""
            width={14}
            height={14}
            className="rounded-sm"
          />
          <span className="max-w-[140px] truncate">
            {source.title || getDomain(source.url)}
          </span>
        </a>
      ))}
    </div>
  );
}
