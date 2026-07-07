import { useQuery } from "@tanstack/react-query";
import { getMonthlyTrends, getTopCategories } from "@/api/analytics";

export function useMonthlyTrends() {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: getMonthlyTrends,
  });
}

export function useTopCategories() {
  return useQuery({
    queryKey: ["analytics", "top-categories"],
    queryFn: getTopCategories,
  });
}
