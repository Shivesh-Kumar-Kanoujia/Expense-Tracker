import { useQuery } from "@tanstack/react-query";
import { getMonthlyTrends, getTopCategories } from "@/api/analytics";

export function useMonthlyTrends(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: getMonthlyTrends,
    enabled: opts?.enabled,
  });
}

export function useTopCategories(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["analytics", "top-categories"],
    queryFn: getTopCategories,
    enabled: opts?.enabled,
  });
}
