import client from "./client";
import type { AuthResponse } from "../types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post("/auth/login", { email, password });
  return data;
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const { data } = await client.post("/auth/register", { email, password, name });
  return data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function getMe(): Promise<AuthResponse> {
  const { data } = await client.get("/auth/me");
  return data;
}
