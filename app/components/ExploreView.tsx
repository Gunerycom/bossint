"use client";

import { useState, useMemo } from "react";
import { TEMPLATE_CATEGORIES, TEMPLATES, AgentTemplate, TemplateCategory } from "../lib/templateData";
import TemplateCard from "./TemplateCard";
import * as Icons from "lucide-react";
import { Search, ChevronLeft, ArrowRight, Library } from "lucide-react";

interface ExploreViewProps {
  onDeployClick: (template: AgentTemplate) => void;
}

export default function ExploreView({ onDeployClick }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Dynamic Lucide icon helper
  const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent className={className} strokeWidth={1.5} />;
  };

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Selected category info
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  // Templates inside selected category
  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return [];
    return TEMPLATES.filter((t) => t.categoryId === selectedCategoryId);
  }, [selectedCategoryId]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TEMPLATES.forEach((t) => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Explore Blueprints</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Search and deploy pre-configured market intelligence and OSINT agents
            </p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-tertiary)]" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-xs transition-colors"
              placeholder="Search templates (e.g. Price, Cyber, Defi)..."
            />
          </div>
        </div>
      </div>

      {/* Conditional rendering based on state */}
      {searchQuery.trim() ? (
        /* Search results */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Search Results ({searchResults.length})
            </h3>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] space-y-2">
              <Library className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[var(--text-primary)]">No matching blueprints found</p>
              <p className="text-xs text-[var(--text-tertiary)]">Try typing different search keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((template) => (
                <TemplateCard key={template.id} template={template} onDeploy={onDeployClick} />
              ))}
            </div>
          )}
        </div>
      ) : selectedCategory ? (
        /* Category Drilldown View */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer"
              title="Back to Categories"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <CategoryIcon name={selectedCategory.icon} className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedCategory.title}</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedCategory.description}</p>
            </div>
          </div>

          {/* Subcategories list */}
          <div className="space-y-8">
            {selectedCategory.subcategories.map((sub) => {
              const subTemplates = categoryTemplates.filter((t) => t.subcategoryId === sub.id);
              if (subTemplates.length === 0) return null;

              return (
                <div key={sub.id} className="space-y-4">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-[var(--border-subtle)]">
                    <CategoryIcon name={sub.icon} className="w-4 h-4 text-[var(--text-secondary)]" />
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      {sub.title}
                    </h4>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-semibold bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded">
                      {subTemplates.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subTemplates.map((template) => (
                      <TemplateCard key={template.id} template={template} onDeploy={onDeployClick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Categories Index Grid */
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            All Agent Categories
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex flex-col text-left border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-sm rounded-xl p-5 transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] group-hover:bg-[var(--accent-subtle)] group-hover:text-[var(--accent)] text-[var(--text-secondary)] transition-colors flex items-center justify-center">
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors uppercase tracking-wider">
                    {cat.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal line-clamp-2 mb-3">
                    {cat.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)] mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore templates</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
