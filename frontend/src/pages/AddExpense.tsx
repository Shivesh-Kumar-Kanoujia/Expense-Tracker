import { useNavigate } from "react-router-dom";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import type { ExpenseInput } from "@/lib/validations";

export default function AddExpense() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createExpense = useCreateExpense();

  const handleSubmit = async (data: ExpenseInput) => {
    try {
      await createExpense.mutateAsync(data);
      showToast("Expense added", "success");
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      throw new Error(typeof msg === "string" ? msg : "Failed to add expense");
    }
  };

  return (
    <div>
      <PageHeader title="Add Expense" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Add Expense" }]} />
      <Card>
        <CardContent>
          <ExpenseForm
            onSubmit={handleSubmit}
            submitLabel="Add Expense"
            loading={createExpense.isPending}
            onCancel={() => navigate("/")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
