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

export interface SessionInfo {
  id: number;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
}

export async function getSessions(): Promise<SessionInfo[]> {
  const { data } = await client.get("/auth/sessions");
  return data.sessions;
}

export async function revokeSession(sessionId: number): Promise<void> {
  await client.delete(`/auth/sessions/${sessionId}`);
}

export async function revokeOtherSessions(): Promise<void> {
  await client.delete("/auth/sessions/others");
}
