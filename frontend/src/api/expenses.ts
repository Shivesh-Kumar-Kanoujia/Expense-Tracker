import client from "./client";
import type { Expense, PaginatedResponse } from "../types";

export interface ExpenseParams {
  page?: number;
  per_page?: number;
  category?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_field?: string;
  sort_order?: string;
}

export async function getExpenses(params?: ExpenseParams): Promise<PaginatedResponse<Expense>> {
  const { data } = await client.get("/expenses", { params });
  return data;
}

export async function createExpense(expense: {
  date: string;
  category: string;
  amount: number;
  description?: string;
}): Promise<Expense> {
  const { data } = await client.post("/expenses", expense);
  return data.expense;
}

export async function updateExpense(
  id: number,
  updates: Partial<{
    date: string;
    category: string;
    amount: number;
    description: string;
  }>
): Promise<Expense> {
  const { data } = await client.put(`/expenses/${id}`, updates);
  return data.expense;
}

export async function deleteExpense(id: number): Promise<void> {
  await client.delete(`/expenses/${id}`);
}
