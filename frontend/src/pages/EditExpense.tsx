import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExpenses, updateExpense, deleteExpense } from "@/api/expenses";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import type { ExpenseInput } from "@/lib/validations";
import type { Expense } from "@/types";
import { Trash2, ArrowLeft } from "lucide-react";

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getExpenses({ per_page: 100 });
        const found = res.expenses.find((e) => e.id === Number(id));
        if (!found) {
          setFetchError("Expense not found");
          return;
        }
        setExpense(found);
      } catch {
        setFetchError("Failed to load expense");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (data: ExpenseInput) => {
    setSaving(true);
    try {
      await updateExpense(Number(id), data);
      showToast("Expense updated", "success");
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      throw new Error(typeof msg === "string" ? msg : "Failed to update expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(Number(id));
      showToast("Expense deleted", "success");
      navigate("/");
    } catch {
      showToast("Failed to delete expense", "error");
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <PageHeader
          title="Edit Expense"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Edit Expense" },
          ]}
        />
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

  if (fetchError) {
    return (
      <div>
        <PageHeader
          title="Edit Expense"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Edit Expense" },
          ]}
        />
        <Card className="border-error/50">
          <CardContent className="p-6 text-center text-error">
            <p className="mb-4">{fetchError}</p>
            <Button
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Expense"
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: "Edit Expense" },
        ]}
      />
      <Card>
        <CardContent>
          <ExpenseForm
            defaultValues={{
              date: expense!.date,
              category: expense!.category,
              amount: expense!.amount,
              description: expense!.description || "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            loading={saving}
            onCancel={() => navigate("/")}
          />
        </CardContent>
        <CardFooter>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            loading={deleting}
            onClick={handleDelete}
          >
            Delete Expense
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
