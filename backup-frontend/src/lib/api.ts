export type UserRole = "admin" | "super_admin";

export interface AuthSession {
  accessToken: string;
  user: {
    id: number;
    role: UserRole;
  };
}

interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: string;
  user: AuthSession["user"];
}

const SESSION_KEY = "f1-helpdesk-session";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7676").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    if (
      typeof session.accessToken !== "string" ||
      typeof session.user?.id !== "number" ||
      (session.user.role !== "admin" && session.user.role !== "super_admin")
    ) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("f1-session-change"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("f1-session-change"));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const session = getSession();
  if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    clearSession();
    if (window.location.pathname !== "/login") {
      window.dispatchEvent(new Event("f1-unauthorized"));
    }
  }

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload), response.status);
  }

  return payload as T;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const session = { accessToken: result.access_token, user: result.user };
  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

function readErrorMessage(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return "The request could not be completed. Please try again.";
  }
  const message = payload.message;
  if (Array.isArray(message)) return message.join(" ");
  return typeof message === "string" ? message : "The request could not be completed.";
}
