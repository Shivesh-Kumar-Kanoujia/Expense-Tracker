import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getSummary } from "@/api/summary";
import { getMonthlyTrends, type MonthlyTrend } from "@/api/analytics";
import { getExpenses, deleteExpense, type ExpenseParams } from "@/api/expenses";
import { getCategories } from "@/api/categories";
import { useToast } from "@/components/ui/Toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { formatCurrency, chartColors } from "@/lib/utils";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import {
  PlusCircle, Wallet, TrendingUp, ListChecks, PiggyBank, BarChart3,
  Sun, Moon, AlertTriangle, RefreshCw, Target, Zap
} from "lucide-react";
import type { Summary, Expense, Category } from "@/types";
import { useIsDark } from "@/hooks/useIsDark";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sun };
  if (h < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

function getErrorMessage(status: number): string {
  if (status === 0) return "Unable to connect to the server. Please check your internet connection.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our end. Please try again.";
  return "Something unexpected happened. Please try again.";
}

function computeInsights(summary: Summary) {
  const insights: { icon: typeof TrendingUp | typeof Zap; text: string }[] = [];
  if (!summary || summary.count === 0) return insights;

  if (summary.average > 0) {
    insights.push({
      icon: TrendingUp,
      text: `Average expense: ${formatCurrency(summary.average)} per transaction`,
    });
  }

  if (summary.categories.length > 0) {
    const topCat = [...summary.categories].sort((a, b) => b.total - a.total)[0];
    const pct = summary.total > 0 ? ((topCat.total / summary.total) * 100).toFixed(1) : "0";
    insights.push({
      icon: Zap,
      text: `Most spent on ${topCat.category} (${pct}% of total)`,
    });
  }

  return insights;
}

export default function Dashboard() {
  const isDark = useIsDark();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("monthlyBudget");
    return saved ? Number(saved) : 0;
  });
  const [budgetInput, setBudgetInput] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [searchAmountMin, setSearchAmountMin] = useState("");
  const [searchAmountMax, setSearchAmountMax] = useState("");

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.map((c: Category) => c.name)))
      .catch(() => {});
  }, []);

  const buildParams = useCallback(
    (p: number): ExpenseParams => {
      const params: ExpenseParams = { page: p, per_page: perPage };
      if (sortField && sortOrder) {
        params.sort_field = sortField;
        params.sort_order = sortOrder;
      }
      if (selectedCategories.length > 0) params.category = selectedCategories.join(",");
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (search) params.search = search;
      return params;
    },
    [perPage, sortField, sortOrder, selectedCategories, dateFrom, dateTo, search]
  );

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const sum = await getSummary({ category: selectedCategories.join(","), date_from: dateFrom, date_to: dateTo });
      setSummary(sum);
      setError("");
    } catch (err: any) {
      setError(getErrorMessage(err.response?.status || 0));
      setErrorStatus(err.response?.status || 0);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedCategories, dateFrom, dateTo]);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const data = await getMonthlyTrends();
      setTrends(data);
    } catch {
      /* trends are supplementary */
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  const fetchExpenses = useCallback(
    async (p: number) => {
      setLoadingExpenses(true);
      try {
        const exp = await getExpenses(buildParams(p));
        setExpenses(exp.expenses);
        setTotal(exp.total);
        setPage(exp.page);
        setPages(exp.pages);
        setError("");
      } catch (err: any) {
        setError(getErrorMessage(err.response?.status || 0));
        setErrorStatus(err.response?.status || 0);
      } finally {
        setLoadingExpenses(false);
      }
    },
    [buildParams]
  );

  const retry = useCallback(() => {
    fetchSummary();
    fetchTrends();
    fetchExpenses(1);
  }, [fetchSummary, fetchTrends, fetchExpenses]);

  useEffect(() => {
    fetchSummary();
    fetchTrends();
  }, [fetchSummary, fetchTrends]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const handleSort = useCallback(
    (field: string) => {
      setSortOrder((prev) => (sortField === field ? (prev === "asc" ? "desc" : "asc") : "asc"));
      setSortField(field);
    },
    [sortField]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteExpense(id);
        showToast("Expense deleted", "success");
        fetchExpenses(page > 1 && expenses.length === 1 ? page - 1 : page);
        fetchSummary();
      } catch {
        showToast("Failed to delete expense", "error");
      }
    },
    [page, expenses.length, fetchExpenses, fetchSummary, showToast]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setSearchAmountMin("");
    setSearchAmountMax("");
    setPage(1);
  }, []);

  const handleSetBudget = useCallback(() => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    setMonthlyBudget(val);
    localStorage.setItem("monthlyBudget", String(val));
    setBudgetInput("");
    showToast("Monthly budget set", "success");
  }, [budgetInput, showToast]);

  const hasExpenses = summary && summary.count > 0;
  const greeting = useMemo(getGreeting, []);
  const GreetIcon = greeting.icon;

  const barChartLabels = trends.map((t) => `${MONTH_NAMES[t.month - 1]}`);
  const colors = chartColors();

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

  const trendsInsight = useMemo(() => {
    if (trends.length < 2) return null;
    const sorted = [...trends].sort((a, b) => b.total - a.total);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    return {
      highest: `${MONTH_NAMES[highest.month - 1]} ${highest.year}`,
      highestAmount: highest.total,
      lowest: `${MONTH_NAMES[lowest.month - 1]} ${lowest.year}`,
    };
  }, [trends]);

  const insights = useMemo(() => computeInsights(summary!), [summary]);

  const budgetUsed = monthlyBudget > 0 && summary ? (summary.total / monthlyBudget) * 100 : 0;
  const budgetRemaining = monthlyBudget > 0 ? monthlyBudget - (summary?.total || 0) : 0;

  return (
    <div className="space-y-8">
      {!user && (
        <Card className="bg-accent-light/20 border-accent/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-text">
                You're using the app as a guest.{' '}
                <Link to="/login" className="text-accent hover:text-accent-hover font-semibold underline underline-offset-2">
                  Sign in
                </Link>{' '}
                or{' '}
                <Link to="/register" className="text-accent hover:text-accent-hover font-semibold underline underline-offset-2">
                  create an account
                </Link>{' '}
                to save your data across devices.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-light/20 text-accent">
            <GreetIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text tracking-tight">
              {greeting.text}{user ? `, ${user.name?.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-sm text-text-secondary">
              {hasExpenses
                ? `You have ${summary!.count} expense${summary!.count === 1 ? "" : "s"} this period`
                : "Here's your financial overview"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/add")} icon={<PlusCircle className="h-4 w-4" />}>
          Add Expense
        </Button>
      </div>

      {error && (
        <Card className="border-error/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-error-light/30 text-error flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-error">Something went wrong</p>
                <p className="text-sm text-text-secondary mt-1">{error}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Button variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={retry}>
                    Try Again
                  </Button>
                  {(errorStatus === 401) && (
                    <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingSummary && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="70%" height="32px" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasExpenses ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Expenses"
              value={formatCurrency(summary!.total)}
              trend={summary!.count > 0 ? { direction: "up", value: `${summary!.count} transactions` } : undefined}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatsCard
              label="Average per Transaction"
              value={formatCurrency(summary!.average)}
              subtitle={`Across ${summary!.categories.length} categories`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatsCard
              label="Total Transactions"
              value={String(summary!.count)}
              subtitle={summary!.categories.length > 0 ? `${summary!.categories.length} categories` : undefined}
              icon={<ListChecks className="h-5 w-5" />}
            />
            <StatsCard
              label="Categories Used"
              value={String(summary!.categories.length)}
              subtitle={summary!.total > 0 ? `Highest: ${[...summary!.categories].sort((a, b) => b.total - a.total)[0]?.category || "—"}` : undefined}
              icon={<PiggyBank className="h-5 w-5" />}
            />
          </div>

          {insights.length > 0 && (
            <Card className="bg-accent-light/10 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="font-medium text-text">Smart Insights</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                  {insights.map((insight, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <insight.icon className="h-3.5 w-3.5" />
                      <span>{insight.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>Your spending over the past months</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTrends ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Skeleton variant="rectangular" width="100%" height="240px" />
                  </div>
                ) : trends.length > 0 ? (
                  <>
                    <div className="h-[250px]" key={isDark ? "bar-dark" : "bar-light"}>
                      <Bar data={barChartData} options={barOptions} />
                    </div>
                    {trendsInsight && (
                      <p className="text-xs text-text-muted mt-3 text-center">
                        Highest spending: <span className="font-medium text-text-secondary">{trendsInsight.highest}</span> ({formatCurrency(trendsInsight.highestAmount)})
                      </p>
                    )}
                  </>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-text-muted text-sm">
                    Monthly trends will appear here as you add expenses over time.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart data={summary!.categories} onCategoryClick={(cat) => setSelectedCategories([cat])} />
                {summary!.categories.length > 0 && (
                  <p className="text-xs text-text-muted text-center mt-3">
                    Click a legend item to filter expenses by category
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle>Monthly Budget</CardTitle>
                    <CardDescription>Track your spending against budget</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyBudget > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Spent</span>
                      <span className="font-medium text-text">{formatCurrency(summary!.total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Budget</span>
                      <span className="font-medium text-text">{formatCurrency(monthlyBudget)}</span>
                    </div>
                    <div className="h-2.5 bg-bg-card-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetUsed > 90 ? "bg-error" : budgetUsed > 70 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        {budgetRemaining >= 0
                          ? `${formatCurrency(budgetRemaining)} remaining`
                          : `${formatCurrency(Math.abs(budgetRemaining))} over budget`}
                      </span>
                      <span className={`font-medium ${budgetRemaining >= 0 ? "text-success" : "text-error"}`}>
                        {budgetUsed.toFixed(1)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMonthlyBudget(0); localStorage.removeItem("monthlyBudget"); }}
                      className="text-xs text-text-muted hover:text-error transition-colors"
                    >
                      Reset budget
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                      Set a monthly budget to track your spending.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSetBudget()}
                      />
                      <Button size="sm" onClick={handleSetBudget} disabled={!budgetInput}>
                        Set
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/add")}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-accent-light/10 border border-accent/20 hover:bg-accent-light/20 transition-all duration-fast group"
                  >
                    <div className="p-2.5 rounded-xl bg-accent/15 text-accent group-hover:scale-110 transition-transform duration-fast">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-text">Add Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/expenses")}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-card-hover/50 border border-border hover:bg-bg-card-hover transition-all duration-fast group"
                  >
                    <div className="p-2.5 rounded-xl bg-text-muted/10 text-text-muted group-hover:scale-110 transition-transform duration-fast">
                      <ListChecks className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-text">All Expenses</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/categories")}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-card-hover/50 border border-border hover:bg-bg-card-hover transition-all duration-fast group"
                  >
                    <div className="p-2.5 rounded-xl bg-text-muted/10 text-text-muted group-hover:scale-110 transition-transform duration-fast">
                      <ListChecks className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-text">Categories</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/analytics")}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-card-hover/50 border border-border hover:bg-bg-card-hover transition-all duration-fast group"
                  >
                    <div className="p-2.5 rounded-xl bg-text-muted/10 text-text-muted group-hover:scale-110 transition-transform duration-fast">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-text">Analytics</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <FilterBar
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={(cats) => { setSelectedCategories(cats); setPage(1); }}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }}
                search={search}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                onClear={handleClearFilters}
              />
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={searchAmountMin}
                    onChange={(e) => setSearchAmountMin(e.target.value)}
                  />
                </div>
                <span className="text-text-muted">—</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={searchAmountMax}
                    onChange={(e) => setSearchAmountMax(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ExpensesTable
            expenses={expenses}
            loading={loadingExpenses}
            page={page}
            pages={pages}
            total={total}
            perPage={perPage}
            onPageChange={fetchExpenses}
            onPerPageChange={(size) => { setPerPage(size); setPage(1); }}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Wallet className="h-12 w-12" />}
              title="No expenses yet"
              description={user ? "Track your spending by adding your first expense." : "Sign in to track your expenses, or add expenses as a guest."}
              action={{
                label: user ? "Add your first expense" : "Get Started",
                onClick: () => user ? navigate("/add") : navigate("/register"),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
