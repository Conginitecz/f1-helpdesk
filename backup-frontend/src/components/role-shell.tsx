"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { getSession, logout, type AuthSession, type UserRole } from "@/lib/api";
interface RoleShellProps { role: UserRole; children: ReactNode; }
interface NavItem { label: string; href: string; icon: string; }
const navigation: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: "dashboard" },
    { label: "Locations & admins", href: "/super-admin/locations-admins", icon: "corporate_fare" },
    { label: "Partners", href: "/super-admin/partners", icon: "groups" },
    { label: "Status requests", href: "/super-admin/status-requests", icon: "inbox_customize" },
    { label: "Inventory", href: "/super-admin/inventory", icon: "inventory_2" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "dashboard" },
    { label: "Service engineers", href: "/admin/engineers", icon: "engineering" },
    { label: "Vendors", href: "/admin/vendors", icon: "handshake" },
    { label: "Inventory", href: "/admin/inventory", icon: "inventory_2" },
  ],
};
const destinations: Record<UserRole, string> = { super_admin: "/super-admin", admin: "/admin" };
const roleLabels: Record<UserRole, string> = { super_admin: "Super Admin", admin: "Admin" };
export function RoleShell({ role, children }: RoleShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const syncSession = () => {
      const current = getSession();
      if (!current) { router.replace("/login"); return; }
      if (current.user.role !== role) { router.replace(destinations[current.user.role]); return; }
      setSession(current);
      setReady(true);
    };
    syncSession();
    window.addEventListener("f1-session-change", syncSession);
    window.addEventListener("storage", syncSession);
    return () => { window.removeEventListener("f1-session-change", syncSession); window.removeEventListener("storage", syncSession); };
  }, [role, router]);
  async function handleLogout() { await logout().catch(() => undefined); router.replace("/login"); }
  if (!ready || !session) { return (<main className="route-loading" aria-live="polite">Checking session\u2026</main>); }
  return (
    <PageShell brandHref={destinations[role]} roleLabel={roleLabels[role]} userBadge={roleLabels[role] + " #" + session.user.id} navItems={navigation[role]} pathname={pathname} onLogout={handleLogout}>
      {children}
    </PageShell>
  );
}
