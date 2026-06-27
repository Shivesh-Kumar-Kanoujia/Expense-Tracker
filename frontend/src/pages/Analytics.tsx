import { useState, useEffect, useMemo } from "react";
import { getMonthlyTrends, getTopCategories, type MonthlyTrend, type TopCategory } from "@/api/analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { ArrowLeft, TrendingUp, DollarSign, PieChart, Download, RefreshCw, AlertTriangle, Zap } from "lucide-react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const handler = () => setIsDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("storage", handler);
    const obs = new MutationObserver(handler);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { window.removeEventListener("storage", handler); obs.disconnect(); };
  }, []);
  return isDark;
}

export default function Analytics() {
  const isDark = useIsDark();
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = () => {
    setLoadingTrends(true);
    setLoadingCategories(true);
    setError("");
    let trendsErr = "";
    let catsErr = "";
    Promise.all([
      getMonthlyTrends()
        .then(setTrends)
        .catch((e: any) => { trendsErr = e?.response?.status === 401 ? "Sign in required" : "Unable to load trends"; })
        .finally(() => setLoadingTrends(false)),
      getTopCategories()
        .then(setTopCategories)
        .catch((e: any) => { catsErr = e?.response?.status === 401 ? "Sign in required" : "Unable to load categories"; })
        .finally(() => setLoadingCategories(false)),
    ]).then(() => {
      if (trendsErr || catsErr) setError([trendsErr, catsErr].filter(Boolean).join(". "));
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const barChartLabels = trends.map((t) => `${MONTH_NAMES[t.month - 1]} ${t.year}`);
  const barChartData = {
    labels: barChartLabels,
    datasets: [
      {
        label: "Spending",
        data: trends.map((t) => t.total),
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
        backgroundColor: "var(--color-bg-card-hover, #313244)",
        titleColor: "var(--color-text, #cdd6f4)",
        bodyColor: "var(--color-text-secondary, #a6adc8)",
        borderColor: "var(--color-border, #45475a)",
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
        ticks: { color: "var(--color-text-secondary, #a6adc8)" },
        grid: { color: "var(--color-border, #45475a)", drawOnChartArea: false },
      },
      y: {
        ticks: {
          color: "var(--color-text-secondary, #a6adc8)",
          callback: (val) => formatCurrency(val as number),
        },
        grid: { color: "var(--color-border, #45475a)" },
      },
    },
  };

  const doughnutData = {
    labels: topCategories.map((c) => c.category),
    datasets: [
      {
        data: topCategories.map((c) => c.total),
        backgroundColor: topCategories.map((c) => CATEGORY_COLORS[c.category] || "#C9CBCF"),
        borderColor: "var(--color-bg-card, #1e1e2e)",
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
          color: "var(--color-text, #cdd6f4)",
          font: { size: 12 },
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
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed as number;
            const pct = topCategories[ctx.dataIndex]?.percentage ?? 0;
            return ` ${formatCurrency(val)} (${pct}%)`;
          },
        },
      },
    },
  };

  const monthlyTotal = trends.reduce((s, t) => s + t.total, 0);
  const monthlyAvg = trends.length > 0 ? monthlyTotal / trends.length : 0;
  const topCat = topCategories[0];

  const trendsInsight = useMemo(() => {
    if (trends.length < 2) return null;
    const sorted = [...trends].sort((a, b) => b.total - a.total);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    return {
      highest: `${MONTH_NAMES[highest.month - 1]} ${highest.year}`,
      highestAmount: highest.total,
      lowest: `${MONTH_NAMES[lowest.month - 1]} ${lowest.year}`,
      change: trends.length >= 2
        ? ((trends[trends.length - 1].total - trends[0].total) / trends[0].total * 100).toFixed(1)
        : null,
    };
  }, [trends]);

  const showErrorCard = error && !loadingTrends && !loadingCategories;

  if (showErrorCard && trends.length === 0 && topCategories.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Analytics" description="Analyze your spending patterns" />
        <Card className="border-error/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-error mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-1">Unable to load analytics</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <Button icon={<RefreshCw className="h-4 w-4" />} onClick={fetchAll}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-text-secondary flex-1">{error}</p>
            <Button size="sm" variant="ghost" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchAll}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
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
                  ...trends.map((t) => [`${MONTH_NAMES[t.month - 1]} ${t.year}`, t.total].join(",")),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "expense-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={trends.length === 0}
            >
              Export Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent-light/20 text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Spent</p>
                {loadingTrends ? (
                  <Skeleton variant="text" width="100px" height="28px" />
                ) : (
                  <p className="text-xl font-bold text-text">{formatCurrency(monthlyTotal)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent-light/20 text-accent">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Monthly Average</p>
                {loadingTrends ? (
                  <Skeleton variant="text" width="100px" height="28px" />
                ) : (
                  <p className="text-xl font-bold text-text">{formatCurrency(monthlyAvg)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent-light/20 text-accent">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Categories Used</p>
                {loadingCategories ? (
                  <Skeleton variant="text" width="80px" height="28px" />
                ) : (
                  <p className="text-xl font-bold text-text">{topCategories.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent-light/20 text-accent">
                <ArrowLeft className="h-5 w-5 rotate-45" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Top Category</p>
                {loadingCategories ? (
                  <Skeleton variant="text" width="100px" height="28px" />
                ) : topCat ? (
                  <p className="text-xl font-bold text-text truncate max-w-[140px]">{topCat.category}</p>
                ) : (
                  <p className="text-sm text-text-muted">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Spending Trends</CardTitle>
            <CardDescription>Your spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton variant="rectangular" width="100%" height="280px" />
              </div>
            ) : trends.length > 0 ? (
              <>
                <div className="h-[300px]" key={isDark ? "bar-dark" : "bar-light"}>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton variant="circular" width="200px" height="200px" />
              </div>
            ) : topCategories.length > 0 ? (
              <>
                  <div className="flex justify-center" key={isDark ? "donut-dark" : "donut-light"}>
                  <div className="w-full max-w-xs">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                </div>
                {topCat && (
                  <div className="flex items-center gap-2 justify-center mt-4 text-xs text-text-muted">
                    <Zap className="h-3.5 w-3.5 text-accent" />
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
      </div>

      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-4">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
