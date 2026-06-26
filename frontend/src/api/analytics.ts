import client from "./client";

export interface MonthlyTrend {
  year: number;
  month: number;
  total: number;
  count: number;
}

export interface TopCategory {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  const { data } = await client.get("/analytics/monthly");
  return data.months;
}

export async function getTopCategories(): Promise<TopCategory[]> {
  const { data } = await client.get("/analytics/top-categories");
  return data.categories;
}
