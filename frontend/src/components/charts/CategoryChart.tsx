import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategoryBreakdown } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  data: CategoryBreakdown[];
  onCategoryClick?: (category: string) => void;
  className?: string;
}

export function CategoryChart({ data, onCategoryClick, className }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        illustration="chart"
        title="No data to display"
        description="Add some expenses to see the category breakdown."
      />
    );
  }

  const total = data.reduce((sum, item) => sum + item.total, 0);

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => CATEGORY_COLORS[d.category] || "#C9CBCF"),
        borderColor: "var(--color-bg-card, #1e1e2e)",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    cutout: "60%",
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          color: "var(--color-text, #cdd6f4)",
          font: { size: 12 },
        },
        onClick: (_e, legendItem) => {
          if (!onCategoryClick || legendItem.index === undefined) return;
          const category = data[legendItem.index]?.category;
          if (category) onCategoryClick(category);
        },
      },
      tooltip: {
        backgroundColor: "var(--color-bg-card-hover, #313244)",
        titleColor: "var(--color-text, #cdd6f4)",
        bodyColor: "var(--color-text-secondary, #a6adc8)",
        borderColor: "var(--color-border, #45475a)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const value = context.parsed as number;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return ` ₹${value.toLocaleString("en-IN")} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="w-full max-w-md">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
