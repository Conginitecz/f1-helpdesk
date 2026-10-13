"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { getSession, logout, type AuthSession, type UserRole } from "@/lib/api";

interface RoleShellProps {
  role: UserRole;
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

/*
 * Navigation per docs/design/design-system/DESIGN.md and the Stitch sidebar:
 * every entry is an icon + label pair.
 *
 * The legacy build listed a "Configuration" entry with no href, rendered as a
 * disabled "Soon" button. It is omitted here rather than shipped as a dead
 * control; Configuration is scheduled as the last step of the restructure and
 * gets a real entry when it exists.
 */
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

const destinations: Record<UserRole, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
};

/** Breadcrumb label for the current route, derived from the nav list. */
function labelForPath(role: UserRole, pathname: string): string {
  return navigation[role].find((item) => item.href === pathname)?.label ?? "Console";
}

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

  const items = navigation[role];

  return (
    // Frame widths come from the --f1-* custom properties in tokens.css so the
    // sidebar, dock and content offset can never drift apart.
    // Breakpoint mapping follows the DESIGN.md grid profile exactly:
    //   mobile  < 768px    -> bottom sheet
    //   tablet  768-1279px -> 64px icon dock
    //   desktop >= 1280px  -> 260px sidebar
    // Tailwind's own sm/lg (640/1024) do not match those boundaries, so the
    // tiers are addressed with md (768) and xl (1280).
    <div className="min-h-screen bg-surface-base md:pl-[var(--f1-dock-width)] xl:pl-[var(--f1-sidebar-width)]">
      {/* Sidebar: dark navy, fixed, 260px on desktop per the DESIGN.md grid
          spec. Below xl it collapses to a 64px icon dock (rendered after). */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[var(--f1-sidebar-width)] flex-col justify-between bg-dark-navy shadow-level-1 xl:flex">
        <div className="flex flex-col">
          <Link
            className="flex h-16 items-center gap-space-sm px-space-lg"
            href={destinations[role]}
          >
            <span className="grid size-8 place-items-center rounded-panel bg-primary-container">
              <Icon className="text-on-primary" name="bolt" size={20} />
            </span>
            <span className="flex flex-col">
              <span className="font-headline text-headline-sm font-bold tracking-tight text-on-primary">
                F1 HELP DESK
              </span>
              <span className="font-mono text-label-sm uppercase tracking-wider text-surface-variant">
                Enterprise Service Core
              </span>
            </span>
          </Link>

          <div className="px-space-md py-space-sm">
            <div className="flex items-center justify-between rounded-panel bg-dark-navy p-space-xs">
              <span className="flex items-center gap-space-xs px-space-xs py-space-xs">
                <Icon className="text-secondary-fixed" name="shield_person" size={16} />
                <span className="font-body text-label-sm text-inverse-on-surface">Context</span>
              </span>
              <span className="rounded-control bg-tertiary px-space-xs py-0.5 font-mono text-data-mono-sm text-on-tertiary">
                {roleLabels[role]}
              </span>
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className="mt-space-xs flex flex-col gap-1 px-space-sm"
          >
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-space-sm rounded-panel px-space-md py-2 font-body text-label-md transition-colors ${
                    active
                      ? "bg-primary-container font-medium text-on-primary"
                      : "text-surface-variant hover:bg-inverse-surface hover:text-on-primary"
                  }`}
                  href={item.href}
                  key={item.label}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-space-sm px-space-md pb-space-md">
          <button
            className="flex min-h-9 items-center justify-center gap-space-xs rounded-control border border-surface-variant bg-transparent font-body text-label-md font-medium text-inverse-on-surface transition-colors hover:bg-inverse-surface"
            onClick={handleLogout}
            type="button"
          >
            <Icon name="logout" size={16} />
            Log out
          </button>
          <p className="font-mono text-data-mono-sm text-surface-variant">
            F1 Dispatch Engine · v4.18.2-prod
          </p>
        </div>
      </aside>

      {/* Tablet tier (768-1279px): navigation collapses to a 64px rail. */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[var(--f1-dock-width)] flex-col items-center gap-1 bg-dark-navy py-space-md md:flex xl:hidden">
        <Link
          className="mb-space-sm grid size-8 place-items-center rounded-panel bg-primary-container"
          href={destinations[role]}
        >
          <Icon className="text-on-primary" name="bolt" size={20} />
        </Link>
        <nav aria-label="Main navigation" className="flex flex-col items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`grid size-10 place-items-center rounded-panel transition-colors ${
                  active
                    ? "bg-primary-container text-on-primary"
                    : "text-surface-variant hover:bg-inverse-surface hover:text-on-primary"
                }`}
                href={item.href}
                key={item.label}
                title={item.label}
              >
                <Icon name={item.icon} size={20} />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 64px tall per the DESIGN.md grid spec. The left padding clears the
          fixed dock/sidebar, which are siblings outside this element. */}
      <header className="sticky top-0 z-40 flex h-[var(--f1-header-height)] items-center justify-between gap-space-md border-b border-border-subtle bg-surface-card px-space-md md:px-space-lg">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs">
          <Icon className="text-text-muted" name="home_repair_service" size={18} />
          <span className="font-body text-label-md text-text-muted">{roleLabels[role]}</span>
          <Icon className="text-text-muted" name="chevron_right" size={16} />
          <span className="font-body text-label-md font-medium text-text-primary">
            {labelForPath(role, pathname)}
          </span>
        </nav>

        <div className="flex items-center gap-space-sm">
          <span className="hidden items-center gap-space-xs rounded-panel bg-surface-base px-space-sm py-1 md:flex">
            <span className="font-body text-label-sm uppercase text-text-muted">Signed in</span>
            <span className="font-body text-label-sm font-semibold text-text-primary">
              {roleLabels[role]} #{session.user.id}
            </span>
          </span>
          <span className="grid size-8 place-items-center rounded-pill bg-primary">
            <Icon className="text-on-primary" name="person" size={18} />
          </span>
        </div>
      </header>

      <main className="min-w-0 px-space-md py-space-lg sm:px-space-lg">{children}</main>

      {/* Mobile (<768px): navigation becomes a fixed bottom sheet. The nav
          items get their own row and logout sits in a separate unified action
          bar pinned above the viewport, per the DESIGN.md mobile profile.
          Stacking the two keeps five labels plus the action inside 390px,
          which a single row cannot do without truncating. */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-panel border-t border-border-subtle bg-surface-card pb-[env(safe-area-inset-bottom)] shadow-level-3 md:hidden"
      >
        <div className="flex">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[var(--f1-mobile-bar-height)] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 font-body text-label-sm transition-colors ${
                  active ? "text-primary" : "text-text-muted"
                }`}
                href={item.href}
                key={item.label}
              >
                <Icon name={item.icon} size={20} />
                <span className="max-w-full truncate px-0.5 text-center leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-border-subtle p-space-xs">
          <button
            className="flex min-h-9 w-full items-center justify-center gap-space-xs rounded-control border border-border-subtle bg-transparent font-body text-label-md font-medium text-text-primary transition-colors hover:bg-surface-base"
            onClick={handleLogout}
            type="button"
          >
            <Icon name="logout" size={16} />
            Log out
          </button>
        </div>
      </nav>
      {/* Keeps the last row clear of the fixed mobile sheet. */}
      <div aria-hidden="true" className="h-[calc(var(--f1-mobile-bar-height)+56px)] md:hidden" />
    </div>
  );
}

