"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getSession, login, type UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const roleHome: Record<UserRole, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) router.replace(roleHome[session.user.role]);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(email.trim(), password);
      router.replace(roleHome[session.user.role]);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Unable to connect. Check the service and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-symbol" aria-hidden="true">F1</span>
          <span>Help Desk</span>
        </div>
        <p className="eyebrow login-eyebrow">OPERATIONS PORTAL</p>
        <h1 id="login-title">Sign in</h1>
        <p className="login-intro">Use your assigned account to continue.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <TextField
            autoComplete="username"
            id="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <TextField
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {error && <Notice tone="error">{error}</Notice>}

          <Button className="login-submit" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </section>
      <aside className="login-side-note" aria-hidden="true">
        <span>F1 / FIELD OPERATIONS</span>
        <p>Support, service and supply in one place.</p>
        <div className="side-rule" />
        <span>V0 · INTERNAL ACCESS</span>
      </aside>
    </main>
  );
}
