import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useExpenses, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import type { ExpenseInput } from "@/lib/validations";
import { Trash2, ArrowLeft } from "lucide-react";

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { authResolved, user } = useAuth();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const canFetch = authResolved && !!user;
  const { data, isLoading, isError } = useExpenses({ per_page: 100 }, { enabled: canFetch });
  const expense = data?.expenses?.find((e) => e.id === Number(id));

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Edit Expense" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Edit Expense" }]} />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton variant="rectangular" height="40px" />
            <Skeleton variant="rectangular" height="40px" />
            <Skeleton variant="rectangular" height="40px" />
            <Skeleton variant="rectangular" height="100px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !expense) {
    return (
      <div>
        <PageHeader title="Edit Expense" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Edit Expense" }]} />
        <Card className="border-error/50">
          <CardContent className="p-6 text-center text-error">
            <p className="mb-4">{!expense ? "Expense not found" : "Failed to load expense"}</p>
            <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (data: ExpenseInput) => {
    try {
      await updateExpense.mutateAsync({ id: Number(id), ...data });
      showToast("Expense updated", "success");
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      throw new Error(typeof msg === "string" ? msg : "Failed to update expense");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense.mutateAsync(Number(id));
      showToast("Expense deleted", "success");
      navigate("/");
    } catch {
      showToast("Failed to delete expense", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Edit Expense" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Edit Expense" }]} />
      <Card>
        <CardContent>
          <ExpenseForm
            defaultValues={{
              date: expense.date,
              category: expense.category,
              amount: expense.amount,
              description: expense.description || "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            loading={updateExpense.isPending}
            onCancel={() => navigate("/")}
          />
        </CardContent>
        <CardFooter>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            loading={deleteExpense.isPending}
            onClick={handleDelete}
          >
            Delete Expense
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
