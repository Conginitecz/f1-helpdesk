"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSession, logout, type AuthSession, type UserRole } from "@/lib/api";

interface RoleShellProps {
  role: UserRole;
  children: ReactNode;
}

const navigation: Record<UserRole, Array<{ label: string; href?: string }>> = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin" },
    { label: "Locations & admins", href: "/super-admin/locations-admins" },
    { label: "Partners", href: "/super-admin/partners" },
    { label: "Status requests", href: "/super-admin/status-requests" },
    { label: "Configuration" },
    { label: "Inventory", href: "/super-admin/inventory" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Service engineers", href: "/admin/engineers" },
    { label: "Vendors", href: "/admin/vendors" },
    { label: "Inventory", href: "/admin/inventory" },
  ],
};

const destinations: Record<UserRole, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
};

export function RoleShell({ role, children }: RoleShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      const current = getSession();
      if (!current) {
        router.replace("/login");
        return;
      }
      if (current.user.role !== role) {
        router.replace(destinations[current.user.role]);
        return;
      }
      setSession(current);
      setReady(true);
    };

    syncSession();
    window.addEventListener("f1-session-change", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("f1-session-change", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [role, router]);

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace("/login");
  }

  if (!ready || !session) {
    return (
      <main className="route-loading" aria-live="polite">
        Checking session…
      </main>
    );
  }

  return (
    <div className="role-layout">
      <aside className="role-sidebar">
        <Link className="brand-mark" href={destinations[role]}>
          <span className="brand-symbol" aria-hidden="true">F1</span>
          <span>Help Desk</span>
        </Link>

        <div className="role-identity">
          <span className="eyebrow">SIGNED IN AS</span>
          <strong>{role === "super_admin" ? "Super admin" : "Admin"}</strong>
          <span className="identity-id">Account #{session.user.id}</span>
        </div>

        <nav className="role-nav" aria-label="Main navigation">
          {navigation[role].map((item) =>
            item.href ? (
              <Link
                className={pathname === item.href ? "nav-current" : "nav-link"}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <button
                aria-disabled="true"
                className="nav-upcoming"
                disabled
                key={item.label}
                title="Coming in a later milestone"
                type="button"
              >
                <span>{item.label}</span>
                <span className="nav-soon">Soon</span>
              </button>
            ),
          )}
        </nav>

        <button className="logout-button" onClick={handleLogout} type="button">
          Log out
        </button>
      </aside>

      <main className="role-main">
        <header className="role-topbar">
          <span>{role === "super_admin" ? "Super admin workspace" : "Admin workspace"}</span>
          <span className="status-indicator"><span /> Session active</span>
        </header>
        <section className="role-content">{children}</section>
      </main>
    </div>
  );
}
