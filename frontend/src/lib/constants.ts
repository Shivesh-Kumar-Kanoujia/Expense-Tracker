export const CATEGORIES = [
  { id: "Food", label: "Food", icon: "utensils", color: "#FF6384" },
  { id: "Travel", label: "Travel", icon: "car", color: "#36A2EB" },
  { id: "Shopping", label: "Shopping", icon: "shopping-bag", color: "#FFCE56" },
  { id: "Bills", label: "Bills", icon: "file-text", color: "#4BC0C0" },
  { id: "Entertainment", label: "Entertainment", icon: "film", color: "#9966FF" },
  { id: "Other", label: "Other", icon: "more-horizontal", color: "#FF9F40" },
] as const;

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.color])
);

export const CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#8DD3C7",
  "#FFFFB3",
  "#BEBADA",
];

export const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "90d" },
  { label: "This Year", value: "year" },
  { label: "Custom Range", value: "custom" },
] as const;

export const PAGINATION_OPTIONS = [10, 25, 50, 100] as const;

export const SORT_ORDERS = ["asc", "desc"] as const;