import client from "./client";
import type { Budget } from "../types";

export interface BudgetParams {
  month?: number;
  year?: number;
}

export interface BudgetInput {
  amount: number;
  category?: string | null;
  month: number;
  year: number;
}

export async function getBudgets(params?: BudgetParams): Promise<Budget[]> {
  const { data } = await client.get("/budgets", { params });
  return data.budgets;
}

export async function upsertBudget(input: BudgetInput): Promise<Budget> {
  const { data } = await client.post("/budgets", input);
  return data.budget;
}

export async function updateBudget(id: number, input: BudgetInput): Promise<Budget> {
  const { data } = await client.put(`/budgets/${id}`, input);
  return data.budget;
}

export async function deleteBudget(id: number): Promise<void> {
  await client.delete(`/budgets/${id}`);
}
