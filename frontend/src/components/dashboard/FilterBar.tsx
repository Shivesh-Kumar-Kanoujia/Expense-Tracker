import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { X, Search, RotateCcw } from "lucide-react";
import { DATE_PRESETS } from "@/lib/constants";

interface FilterBarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (cats: string[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateChange: (from: string, to: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onClear: () => void;
  className?: string;
}

function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      return { from: to, to };
    }
    case "week": {
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      return { from: monday.toISOString().split("T")[0], to };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first.toISOString().split("T")[0], to };
    }
    case "30d": {
      const d30 = new Date(now);
      d30.setDate(now.getDate() - 30);
      return { from: d30.toISOString().split("T")[0], to };
    }
    case "90d": {
      const d90 = new Date(now);
      d90.setDate(now.getDate() - 90);
      return { from: d90.toISOString().split("T")[0], to };
    }
    case "year": {
      const firstY = new Date(now.getFullYear(), 0, 1);
      return { from: firstY.toISOString().split("T")[0], to };
    }
    default:
      return { from: "", to: "" };
  }
}

export function FilterBar({
  categories,
  selectedCategories,
  onCategoriesChange,
  dateFrom,
  dateTo,
  onDateChange,
  search,
  onSearchChange,
  onClear,
  className,
}: FilterBarProps) {
  const [activePreset, setActivePreset] = useState<string>("month");
  const [inputValue, setInputValue] = useState(search);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => onSearchChange(val), 300);
      setDebounceTimer(timer);
    },
    [onSearchChange, debounceTimer]
  );

  const handlePreset = useCallback(
    (preset: string) => {
      setActivePreset(preset);
      if (preset !== "custom") {
        const { from, to } = getDateRange(preset);
        onDateChange(from, to);
      }
    },
    [onDateChange]
  );

  const toggleCategory = useCallback(
    (cat: string) => {
      const next = selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat];
      onCategoriesChange(next);
    },
    [selectedCategories, onCategoriesChange]
  );

  const datePresets = useMemo(
    () => DATE_PRESETS.filter((p) => p.value !== "custom"),
    []
  );

  const hasFilters = search || selectedCategories.length > 0 || dateFrom || dateTo;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search descriptions..."
            value={inputValue}
            onChange={handleSearchInput}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {datePresets.map((preset) => (
            <Button
              key={preset.value}
              variant={activePreset === preset.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => handlePreset(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
          {activePreset === "custom" && (
            <span className="text-xs text-text-secondary font-medium">Custom:</span>
          )}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setActivePreset("custom");
              onDateChange(e.target.value, dateTo);
            }}
            className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-text-muted text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setActivePreset("custom");
              onDateChange(dateFrom, e.target.value);
            }}
            className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">Categories:</span>
          {categories.map((cat) => {
            const selected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors duration-fast",
                  selected
                    ? "bg-accent-light/20 text-accent border border-accent/30"
                    : "bg-bg-card-hover text-text-secondary border border-border hover:border-text-muted"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedCategories.map((cat) => (
            <Badge key={cat} variant="accent" size="sm">
              {cat}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="ml-1 hover:text-text transition-colors"
                aria-label={`Remove ${cat} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} icon={<RotateCcw className="h-3.5 w-3.5" />}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
