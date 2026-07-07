import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/api/categories";
import client from "@/api/client";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: { id: number; sort_order: number }[]) => {
      await client.put("/categories/reorder", { order });
    },
    onMutate: async (order) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const prev = qc.getQueryData<{ id: number; name: string; sort_order?: number }[]>(["categories"]);
      if (prev) {
        const orderMap = new Map(order.map((o) => [o.id, o.sort_order]));
        qc.setQueryData(["categories"], [...prev].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)));
      }
      return { prev };
    },
    onError: (_err, _order, ctx) => {
      if (ctx?.prev) qc.setQueryData(["categories"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
