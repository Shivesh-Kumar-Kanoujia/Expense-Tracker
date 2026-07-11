import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBudgets, upsertBudget, deleteBudget, type BudgetParams } from "@/api/budgets";

export function useBudgets(params?: BudgetParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["budgets", params],
    queryFn: () => getBudgets(params),
    enabled: opts?.enabled,
  });
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
