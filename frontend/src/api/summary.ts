import client from "./client";
import type { Summary } from "../types";

export interface SummaryParams {
  category?: string;
  date_from?: string;
  date_to?: string;
}

export async function getSummary(params?: SummaryParams): Promise<Summary> {
  const { data } = await client.get("/summary", { params });
  return data;
}
