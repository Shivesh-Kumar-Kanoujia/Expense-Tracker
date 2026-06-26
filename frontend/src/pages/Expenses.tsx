import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getExpenses, deleteExpense, type ExpenseParams } from "@/api/expenses";
import { getCategories } from "@/api/categories";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, Edit, Trash2, Wallet, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import type { Expense, Category } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Travel: "🚗",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Other: "📌",
};

const CATEGORY_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info" | "accent"> = {
  Food: "success",
  Travel: "info",
  Shopping: "warning",
  Bills: "danger",
  Entertainment: "accent",
};

export default function Expenses() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [sortField] = useState<string>("date");
  const [sortOrder] = useState<"asc" | "desc">("desc");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.map((c: Category) => c.name)))
      .catch(() => {});
  }, []);

  const buildParams = useCallback(
    (p: number): ExpenseParams => ({
      page: p,
      per_page: perPage,
      sort_field: sortField,
      sort_order: sortOrder,
      category: selectedCategories.join(",") || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
    }),
    [perPage, sortField, sortOrder, selectedCategories, dateFrom, dateTo, search]
  );

  const fetchExpenses = useCallback(
    async (p: number = page) => {
      setLoading(true);
      try {
        const exp = await getExpenses(buildParams(p));
        setExpenses(exp.expenses);
        setTotal(exp.total);
        setPage(exp.page);
        setPages(exp.pages);
      } catch {
        setError("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, page]
  );

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const handleDelete = useCallback(
    async (id: number) => {
      setDeleting(true);
      try {
        await deleteExpense(id);
        showToast("Expense deleted", "success");
        fetchExpenses(page > 1 && expenses.length === 1 ? page - 1 : page);
      } catch {
        showToast("Failed to delete expense", "error");
      } finally {
        setDeleting(false);
        setDeleteId(null);
      }
    },
    [page, expenses.length, fetchExpenses, showToast]
  );

  const handleDuplicate = useCallback(
    async (expense: Expense) => {
      try {
        const { createExpense } = await import("@/api/expenses");
        await createExpense({
          date: expense.date,
          category: expense.category,
          amount: expense.amount,
          description: expense.description || undefined,
        });
        showToast("Expense duplicated", "success");
        fetchExpenses(page);
      } catch {
        showToast("Failed to duplicate expense", "error");
      }
    },
    [page, fetchExpenses, showToast]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([]);
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  }, []);

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  if (error && !loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Expenses" description="Manage all your expenses" />
        <Card>
          <CardContent className="p-12 text-center text-error">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Expenses"
        description="Manage all your expenses"
        actions={
          <Button onClick={() => navigate("/add")} icon={<PlusCircle className="h-4 w-4" />}>
            Add Expense
          </Button>
        }
      />

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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {loading ? (
            <Skeleton variant="text" width="120px" />
          ) : total > 0 ? (
            <>{from}–{to} of {total} expenses</>
          ) : null}
        </p>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
          className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {[12, 24, 48].map((opt) => (
            <option key={opt} value={opt}>{opt} per page</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width="44px" height="44px" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
                <Skeleton variant="text" width="80%" />
                <div className="flex justify-between items-center">
                  <Skeleton variant="text" width="50px" />
                  <div className="flex gap-2">
                    <Skeleton variant="rectangular" width="32px" height="32px" />
                    <Skeleton variant="rectangular" width="32px" height="32px" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : expenses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              hover
              className="group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl bg-accent-light/15 flex items-center justify-center text-lg flex-shrink-0">
                    {CATEGORY_ICONS[expense.category] || "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant={CATEGORY_VARIANTS[expense.category] || "default"} size="sm">
                          {expense.category}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-text tabular-nums whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{formatDate(expense.date)}</p>
                  </div>
                </div>
                {expense.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {expense.description}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                  <Link
                    to={`/edit/${expense.id}`}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors duration-fast"
                    aria-label={`Edit ${expense.category} expense`}
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(expense)}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-card-hover transition-colors duration-fast"
                    aria-label={`Duplicate ${expense.category} expense`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(expense.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light/20 transition-colors duration-fast"
                    aria-label={`Delete ${expense.category} expense`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Wallet className="h-12 w-12" />}
              title="No expenses found"
              description={search || selectedCategories.length > 0 ? "Try adjusting your filters." : "Start tracking your spending today."}
              action={{
                label: search || selectedCategories.length > 0 ? "Clear filters" : "Add your first expense",
                onClick: () => search || selectedCategories.length > 0 ? handleClearFilters() : navigate("/add"),
              }}
            />
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchExpenses(page - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pages - 4));
              const p = start + i;
              if (p > pages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => fetchExpenses(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= pages}
              onClick={() => fetchExpenses(page + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Delete expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
