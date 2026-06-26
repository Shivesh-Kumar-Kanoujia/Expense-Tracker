import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Utensils,
  Car,
  ShoppingBag,
  FileText,
  Film,
  MoreHorizontal,
} from "lucide-react";
import { expenseSchema } from "@/lib/validations";
import type { ExpenseInput } from "@/lib/validations";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  "file-text": FileText,
  film: Film,
  "more-horizontal": MoreHorizontal,
};

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseInput>;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
  onCancel?: () => void;
}

export function ExpenseForm({
  defaultValues,
  onSubmit,
  submitLabel,
  loading,
  onCancel,
}: ExpenseFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: today,
      category: "" as ExpenseInput["category"],
      description: "",
      amount: undefined as unknown as number,
      ...defaultValues,
    },
  });

  const category = form.watch("category");
  const description = form.watch("description") || "";
  const { register, setValue, setError, formState: { errors } } = form;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const onFormSubmit = async (data: ExpenseInput) => {
    try {
      await onSubmit(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong";
      setError("root", {
        message: msg,
        type: "server",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onFormSubmit)} className="max-w-lg space-y-6">
      {errors.root && (
        <div
          className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <Input
        label="Date"
        type="date"
        max={today}
        error={errors.date?.message}
        {...register("date")}
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Category
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Category selection"
        >
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon];
            const selected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  setValue("category", cat.id as any, { shouldValidate: true })
                }
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  selected
                    ? "text-white shadow-sm"
                    : "bg-bg-card-hover text-text-secondary hover:bg-bg-card-hover/80 border border-border"
                )}
                style={selected ? { backgroundColor: cat.color } : undefined}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {cat.label}
              </button>
            );
          })}
        </div>
        {errors.category && (
          <p className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
            {errors.category.message}
          </p>
        )}
      </div>

      <Input
        label="Amount (₹)"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />

      <div>
        <Textarea
          label="Description"
          placeholder="e.g., Lunch at restaurant"
          maxLength={200}
          error={errors.description?.message}
          {...register("description")}
        />
        <p className="mt-1 text-xs text-text-muted text-right">
          {description.length}/200
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
