import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBudgets, useUpsertBudget, useDeleteBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Target, Wallet, PiggyBank } from "lucide-react";
import type { Category } from "@/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Budgets() {
  const { showToast } = useToast();
  const { authResolved, user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const canFetch = authResolved && !!user;
  const { data: budgets, isLoading } = useBudgets({ month: selectedMonth, year: selectedYear }, { enabled: canFetch });
  const { data: categoryList } = useCategories({ enabled: canFetch });
  const upsertBudget = useUpsertBudget();
  const deleteBudget = useDeleteBudget();

  const [newCategory, setNewCategory] = useState<string>("");
  const [newAmount, setNewAmount] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const categories = (categoryList ?? []).map((c: Category) => c.name);
  const overallBudget = (budgets ?? []).find((b) => !b.category);
  const categoryBudgets = (budgets ?? []).filter((b) => b.category);

  const handleAdd = async () => {
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) return;
    try {
      await upsertBudget.mutateAsync({
        amount: Number(newAmount),
        category: newCategory || null,
        month: selectedMonth,
        year: selectedYear,
      });
      setNewAmount("");
      setNewCategory("");
      showToast(newCategory ? "Category budget set" : "Overall budget set", "success");
    } catch {
      showToast("Failed to save budget", "error");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteBudget.mutateAsync(deleteId);
      showToast("Budget removed", "success");
    } catch {
      showToast("Failed to remove budget", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const categoryOptions = useMemo(
    () => categories.filter((c) => !categoryBudgets.some((b) => b.category === c)),
    [categories, categoryBudgets]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton variant="rectangular" height="50px" />
            <Skeleton variant="rectangular" height="50px" />
            <Skeleton variant="rectangular" height="50px" />
          </CardContent>
        </Card>
      ) : (
        <>
          {overallBudget && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle>Overall Budget</CardTitle>
                    <CardDescription>Total monthly spending cap</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-text">{formatCurrency(overallBudget.amount)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setDeleteId(overallBudget.id)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {categoryBudgets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle>Category Budgets</CardTitle>
                    <CardDescription>Per-category spending limits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryBudgets.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-card-hover/50">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-4 w-4 text-text-muted" />
                        <span className="font-medium text-text">{b.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-text">{formatCurrency(b.amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => setDeleteId(b.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!overallBudget || categoryOptions.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{overallBudget ? "Add Category Budget" : "Set Budget"}</CardTitle>
                <CardDescription>
                  {overallBudget
                    ? "Add per-category limits for this month"
                    : "Set an overall monthly budget first"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overallBudget ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                    >
                      <option value="">Select category...</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="w-40">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAdd}
                      disabled={!newCategory || !newAmount}
                      loading={upsertBudget.isPending}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-48">
                      <Input
                        type="number"
                        placeholder="Monthly budget amount"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      />
                    </div>
                    <Button
                      onClick={handleAdd}
                      disabled={!newAmount}
                      loading={upsertBudget.isPending}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Set Budget
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!overallBudget && categoryBudgets.length === 0 && (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={<Target className="h-12 w-12" />}
                  title="No budgets set"
                  description={`Set a monthly budget for ${MONTHS[selectedMonth - 1]} ${selectedYear} to track your spending.`}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Budget"
        description="Are you sure you want to remove this budget? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
        loading={deleteBudget.isPending}
      />
    </div>
  );
}
