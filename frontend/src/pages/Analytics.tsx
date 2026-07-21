import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMonthlyTrends, useTopCategories } from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, chartColors } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { TrendingUp, TrendingDown, Download, RefreshCw, AlertTriangle, PieChart, Award } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { useIsDark } from "@/hooks/useIsDark";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutExpo } },
};

type RangeKey = "3M" | "6M" | "1Y" | "all";

const RANGE_OPTIONS: RangeKey[] = ["3M", "6M", "1Y", "all"];

function filterTrends(trends: { year: number; month: number; total: number; count: number }[], range: RangeKey) {
  if (range === "all") return trends;
  const monthsMap: Partial<Record<RangeKey, number>> = { "3M": 3, "6M": 6, "1Y": 12 };
  const count = monthsMap[range] ?? trends.length;
  return trends.slice(-count);
}

export default function Analytics() {
  const isDark = useIsDark();
  const { authResolved, user } = useAuth();
  const canFetch = authResolved && !!user;
  const { data: trends, isLoading: loadingTrends, isError: trendsError } = useMonthlyTrends({ enabled: canFetch });
  const { data: topCategories, isLoading: loadingCategories, isError: catsError } = useTopCategories({ enabled: canFetch });

  const [range, setRange] = useState<RangeKey>("6M");

  const error = trendsError || catsError ? "Failed to load some analytics data" : "";
  const colors = chartColors();

  const filteredTrends = useMemo(() => filterTrends(trends ?? [], range), [trends, range]);

  const barChartLabels = filteredTrends.map((t) => `${MONTH_NAMES[t.month - 1]} ${t.year}`);
  const barChartData = {
    labels: barChartLabels,
    datasets: [
      {
        label: "Spending",
        data: filteredTrends.map((t) => t.total),
        backgroundColor: "rgba(212, 175, 55, 0.7)",
        borderColor: "#D4AF37",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipTitle,
        bodyColor: colors.tooltipBody,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y as number)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.grid, drawOnChartArea: false },
      },
      y: {
        ticks: {
          color: colors.text,
          callback: (val) => formatCurrency(val as number),
        },
        grid: { color: colors.grid },
      },
    },
  };

  const doughnutData = {
    labels: (topCategories ?? []).map((c) => c.category),
    datasets: [
      {
        data: (topCategories ?? []).map((c) => c.total),
        backgroundColor: (topCategories ?? []).map((c) => CATEGORY_COLORS[c.category] || "#C9CBCF"),
        borderColor: colors.tooltipBg,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    cutout: "55%",
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          color: colors.tooltipTitle,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipTitle,
        bodyColor: colors.tooltipBody,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed as number;
            const pct = (topCategories ?? [])[ctx.dataIndex]?.percentage ?? 0;
            return ` ${formatCurrency(val)} (${pct}%)`;
          },
        },
      },
    },
  };

  const monthlyTotal = filteredTrends.reduce((s, t) => s + t.total, 0);
  const monthlyAvg = filteredTrends.length > 0 ? monthlyTotal / filteredTrends.length : 0;
  const topCat = (topCategories ?? [])[0];

  const trendsInsight = useMemo(() => {
    if (!filteredTrends || filteredTrends.length < 2) return null;
    const sorted = [...filteredTrends].sort((a, b) => b.total - a.total);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    return {
      highest: `${MONTH_NAMES[highest.month - 1]} ${highest.year}`,
      highestAmount: highest.total,
      lowest: `${MONTH_NAMES[lowest.month - 1]} ${lowest.year}`,
      change: filteredTrends.length >= 2
        ? ((filteredTrends[filteredTrends.length - 1].total - filteredTrends[0].total) / filteredTrends[0].total * 100).toFixed(1)
        : null,
    };
  }, [filteredTrends]);

  const totalTrend = useMemo(() => {
    if (!filteredTrends || filteredTrends.length < 2) return undefined;
    const first = filteredTrends[0].total;
    const last = filteredTrends[filteredTrends.length - 1].total;
    if (first === 0) return undefined;
    const pct = ((last - first) / first * 100).toFixed(1);
    return {
      direction: (last >= first ? "up" : "down") as "up" | "down",
      value: `${pct}% vs first month`,
    };
  }, [filteredTrends]);

  const showErrorCard = error && !loadingTrends && !loadingCategories;
  const noData = (!loadingTrends && (!trends || trends.length === 0)) && (!loadingCategories && (!topCategories || topCategories.length === 0));

  if (showErrorCard && noData) {
    return (
      <div className="space-y-8">
        <PageHeader title="Analytics" description="Analyze your spending patterns" />
        <Card className="border-error/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-error mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-1">Unable to load analytics</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {error && (
        <motion.div variants={staggerItem}>
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <p className="text-sm text-text-secondary flex-1">{error}</p>
              <Button size="sm" variant="ghost" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
      <motion.div variants={staggerItem}>
        <PageHeader
          title="Analytics"
          description="Analyze your spending patterns"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const csv = [
                    ["Month", "Amount"].join(","),
                    ...(trends ?? []).map((t) => [`${MONTH_NAMES[t.month - 1]} ${t.year}`, t.total].join(",")),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "expense-report.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!trends || trends.length === 0}
              >
                Export Report
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          {loadingTrends ? (
            <Card><CardContent className="p-5 space-y-3"><Skeleton variant="text" width="50%" /><Skeleton variant="text" width="70%" height="28px" /></CardContent></Card>
          ) : (
            <StatsCard
              label="Total Spent"
              value={formatCurrency(monthlyTotal)}
              subtitle={filteredTrends.length > 0 ? `Across ${filteredTrends.length} months` : undefined}
              trend={totalTrend}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          )}
        </motion.div>
        <motion.div variants={staggerItem}>
          {loadingTrends ? (
            <Card><CardContent className="p-5 space-y-3"><Skeleton variant="text" width="50%" /><Skeleton variant="text" width="70%" height="28px" /></CardContent></Card>
          ) : (
            <StatsCard
              label="Monthly Average"
              value={formatCurrency(monthlyAvg)}
              subtitle={filteredTrends.length > 0 ? `Over ${filteredTrends.length} months` : undefined}
              icon={<TrendingDown className="h-5 w-5" />}
            />
          )}
        </motion.div>
        <motion.div variants={staggerItem}>
          {loadingCategories ? (
            <Card><CardContent className="p-5 space-y-3"><Skeleton variant="text" width="50%" /><Skeleton variant="text" width="40%" height="28px" /></CardContent></Card>
          ) : (
            <StatsCard
              label="Categories Used"
              value={String((topCategories ?? []).length)}
              subtitle={`${(topCategories ?? []).length} tracked`}
              icon={<PieChart className="h-5 w-5" />}
            />
          )}
        </motion.div>
        <motion.div variants={staggerItem}>
          {loadingCategories ? (
            <Card><CardContent className="p-5 space-y-3"><Skeleton variant="text" width="50%" /><Skeleton variant="text" width="70%" height="28px" /></CardContent></Card>
          ) : (
            <StatsCard
              label="Top Category"
              value={topCat ? topCat.category : "—"}
              subtitle={topCat ? `${topCat.count} txns · ${topCat.percentage}% of total` : undefined}
              icon={<Award className="h-5 w-5" />}
            />
          )}
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Monthly Spending Trends</CardTitle>
                  <CardDescription>Your spending over time</CardDescription>
                </div>
                {trends && trends.length > 0 && (
                  <div className="flex items-center gap-1 p-0.5 bg-bg-card-hover/50 rounded-lg border border-border w-fit">
                    {RANGE_OPTIONS.map((lbl) => (
                      <button
                        key={lbl}
                        onClick={() => setRange(lbl)}
                        className={`px-3 py-2 text-xs font-medium rounded-md transition-colors min-h-[44px] ${
                           range === lbl
                             ? "bg-text text-bg shadow-sm"
                             : "text-text-secondary hover:text-text"
                         }`}
                      >
                        {lbl === "all" ? "All" : lbl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton variant="rectangular" width="100%" height="280px" />
                </div>
              ) : filteredTrends.length > 0 ? (
                <>
                  <div className="h-[300px]" key={`${isDark ? "bar-dark" : "bar-light"}-${range}`}>
                    <Bar data={barChartData} options={barOptions} />
                  </div>
                  {trendsInsight && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-text-muted justify-center">
                      <span>
                        Highest: <strong className="text-text-secondary">{trendsInsight.highest}</strong> ({formatCurrency(trendsInsight.highestAmount)})
                      </span>
                      {trendsInsight.change && (
                        <span>
                          Overall change: <strong className={Number(trendsInsight.change) >= 0 ? "text-error" : "text-success"}>
                            {Number(trendsInsight.change) >= 0 ? "+" : ""}{trendsInsight.change}%
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  illustration="chart"
                  title="No data yet"
                  description="Add expenses to see your monthly trends."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Where your money goes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton variant="circular" width="200px" height="200px" />
                </div>
              ) : topCategories && topCategories.length > 0 ? (
                <>
                  <div className="flex justify-center" key={isDark ? "donut-dark" : "donut-light"}>
                    <div className="w-full max-w-xs">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  </div>
                  {topCat && (
                    <div className="flex items-center gap-2 justify-center mt-4 text-xs text-text-muted">
                      <Award className="h-3.5 w-3.5 text-accent" />
                      <span>
                        Biggest category: <strong className="text-text-secondary">{topCat.category}</strong> ({topCat.percentage}% of spending)
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  illustration="chart"
                  title="No data yet"
                  description="Add expenses to see your category breakdown."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {topCategories && topCategories.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
                {topCategories.map((cat, i) => (
                  <motion.div key={cat.category} variants={staggerItem} className="flex items-center gap-4">
                    <span className="w-6 text-sm font-semibold text-text-muted">#{i + 1}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text">{cat.category}</span>
                        <span className="text-sm text-text-secondary">
                          {formatCurrency(cat.total)}
                          <span className="text-text-muted ml-1">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-bg-card-hover rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: CATEGORY_COLORS[cat.category] || "#D4AF37",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted w-16 text-right">
                      {cat.count} txns
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
