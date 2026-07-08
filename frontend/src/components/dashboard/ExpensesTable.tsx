import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PAGINATION_OPTIONS } from "@/lib/constants";
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowDownAZ, ArrowUpAZ, Calendar, Tag, CreditCard, Utensils, Plane, ShoppingBag, FileText, Film, Stethoscope, GraduationCap, Home, Zap } from "lucide-react";
import type { Expense } from "@/types";

interface ExpensesTableProps {
  expenses: Expense[];
  loading: boolean;
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (size: number) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onDelete: (id: number) => void;
  emptyMessage?: string;
  className?: string;
}

const CATEGORY_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info" | "accent"> = {
  Food: "success",
  Travel: "info",
  Shopping: "warning",
  Bills: "danger",
  Entertainment: "accent",
};

const CATEGORY_ICONS: Record<string, typeof Tag> = {
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Bills: FileText,
  Entertainment: Film,
  Healthcare: Stethoscope,
  Education: GraduationCap,
  Housing: Home,
  Utilities: Zap,
};

export function ExpensesTable({
  expenses,
  loading,
  page,
  pages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  sortField,
  sortOrder,
  onSort,
  onDelete,
  emptyMessage = "No expenses found.",
  className,
}: ExpensesTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, onDelete]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2 w-1/3">
               <Skeleton variant="text" width="80%" />
               <Skeleton variant="text" width="50%" />
            </div>
            <Skeleton variant="rectangular" width="80px" height="30px" />
          </div>
        ))}
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className={cn("glass rounded-xl", className)}>
        <EmptyState
          illustration="expenses"
          title={emptyMessage}
          description="Try adjusting your filters or add a new expense."
        />
      </div>
    );
  }

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const SortButton = ({ field, label }: { field: string, label: string }) => {
    const isActive = sortField === field;
    return (
      <button 
        onClick={() => onSort(field)} 
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          isActive ? "bg-primary/20 text-primary" : "hover:bg-bg-card-hover text-text-secondary"
        )}
      >
        {label}
        {isActive && (sortOrder === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />)}
      </button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="sticky top-0 z-tooltip flex items-center justify-between px-2 py-2 -mx-2 bg-bg/60 backdrop-blur-glass rounded-xl border border-border/50">
         <div className="text-sm font-medium text-text-secondary">
           Showing {from}-{to} of {total}
         </div>
         <div className="flex items-center gap-2 bg-bg-card/50 backdrop-blur-glass p-1 rounded-xl border border-border">
            <SortButton field="date" label="Date" />
            <SortButton field="amount" label="Amount" />
         </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="glass p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-glass hover:-translate-y-0.5 transition-all duration-300 hover:border-primary/30">
            <div className="flex items-start sm:items-center gap-4 flex-1 overflow-hidden">
              <div className="h-12 w-12 rounded-2xl bg-bg border border-border flex items-center justify-center flex-shrink-0 shadow-sm text-text-muted group-hover:text-primary group-hover:border-primary/30 transition-colors">
                {(() => {
                  const IconComponent = CATEGORY_ICONS[expense.category] || Tag;
                  return <IconComponent className="h-5 w-5" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-text truncate text-base">
                  {expense.description || expense.category}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted mt-1">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(expense.date)}</span>
                  <span className="flex items-center gap-1.5 hidden sm:flex"><CreditCard className="h-3.5 w-3.5" />Card</span>
                  <Badge
                    variant={CATEGORY_VARIANTS[expense.category] || "default"}
                    size="sm"
                    className="ml-0 sm:ml-2"
                  >
                    {expense.category}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border sm:border-0">
              <div className="text-left sm:text-right flex flex-col items-end gap-1">
                <p className={cn("font-bold tabular-nums text-lg", expense.amount >= 0 ? "text-text" : "text-error")}>
                  {formatCurrency(expense.amount)}
                </p>
                {Math.abs(expense.amount) > 5000 && (
                  <Badge variant="warning" size="sm">Large</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  to={`/edit/${expense.id}`}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors duration-fast"
                  aria-label={`Edit expense ${expense.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteId(expense.id)}
                  aria-label={`Delete expense ${expense.id}`}
                  className="text-text-muted hover:text-error hover:bg-error/10"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 glass rounded-xl">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50 transition-colors"
          >
            {PAGINATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
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
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            icon={<ChevronRight className="h-4 w-4" />}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

