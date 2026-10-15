"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminPartner } from "@/components/admin/types";
import type { InventoryItem } from "@/components/inventory/types";
import { Icon } from "@/components/icon";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { Panel } from "@/components/ui/panel";
import { ApiError, apiRequest } from "@/lib/api";

interface AdminOverview {
  vendors: number;
  engineers: number;
  inventoryItems: number;
  inventoryUnits: number;
}

export default function AdminArea() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [vendors, engineers, inventory] = await Promise.all([
        apiRequest<AdminPartner[]>("/admin/partners?type=vendor"),
        apiRequest<AdminPartner[]>("/admin/partners?type=engineer"),
        apiRequest<InventoryItem[]>("/admin/inventory"),
      ]);
      const activeInventory = inventory.filter((item) => item.is_active);
      setOverview({
        vendors: vendors.filter((partner) => partner.is_active && !partner.is_deleted).length,
        engineers: engineers.filter((partner) => partner.is_active && !partner.is_deleted).length,
        inventoryItems: activeInventory.length,
        inventoryUnits: activeInventory.reduce((total, item) => total + item.units, 0),
      });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not load your workspace overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadOverview());
  }, [loadOverview]);

  return (
    <RoleShell role="admin">
      <div className="mb-space-xl flex flex-col gap-space-sm border-b border-border-subtle pb-space-lg lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-space-xs flex items-center gap-space-xs font-mono text-data-mono-sm font-semibold uppercase text-accent-teal">
            <span className="size-2 rounded-pill bg-accent-teal" /> Admin workspace
          </p>
          <h1 className="font-headline text-headline-xl text-text-primary">Operations overview</h1>
          <p className="mt-space-xs max-w-2xl font-body text-body-md text-text-muted">
            Vendors, service engineers, and inventory managed by your admin account.
          </p>
        </div>
        <span className="font-mono text-data-mono-sm text-text-muted">CURRENT WORKSPACE</span>
      </div>
      {loading ? <ScreenState kind="loading" message="Loading your workspace overview…" /> : error ? (
        <ScreenState kind="error" message={error} onRetry={() => void loadOverview()} />
      ) : overview ? (
        <>
          <div className="mb-space-xl grid gap-space-md sm:grid-cols-2 xl:grid-cols-3" aria-label="Workspace summary">
            <SummaryLink
              href="/admin/engineers"
              icon="engineering"
              label="Active service engineers"
              value={overview.engineers}
              detail="Your direct and vendor-linked engineers"
            />
            <SummaryLink
              href="/admin/vendors"
              icon="handshake"
              label="Active vendors"
              value={overview.vendors}
              detail="Vendors available to your workspace"
            />
            <SummaryLink
              href="/admin/inventory"
              icon="inventory_2"
              label="Inventory units"
              value={overview.inventoryUnits}
              detail={`${overview.inventoryItems} active item${overview.inventoryItems === 1 ? "" : "s"} at your location`}
            />
          </div>
          <Panel title="Workspace directories" className="max-w-5xl">
            <nav aria-label="Workspace directories" className="divide-y divide-border-subtle">
              <DirectoryLink href="/admin/engineers" icon="engineering" title="Service engineers" description="View and manage your service engineer directory." />
              <DirectoryLink href="/admin/vendors" icon="handshake" title="Vendors" description="View and onboard vendors for your workspace." />
              <DirectoryLink href="/admin/inventory" icon="inventory_2" title="Inventory" description="View and add stock assigned to your location." />
            </nav>
          </Panel>
        </>
      ) : null}
    </RoleShell>
  );
}

function SummaryLink({
  href,
  icon,
  label,
  value,
  detail,
}: {
  href: string;
  icon: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Link
      className="group rounded-panel border border-border-subtle bg-surface-card p-space-md shadow-level-1 transition hover:border-primary hover:shadow-level-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      href={href}
    >
      <div className="mb-space-md flex items-center justify-between gap-space-sm">
        <span className="font-body text-label-sm uppercase text-text-muted">{label}</span>
        <Icon className="text-primary" name={icon} size={20} />
      </div>
      <strong className="block font-headline text-headline-xl tabular-nums text-text-primary">{value}</strong>
      <span className="mt-space-xs block font-body text-body-sm text-text-muted">{detail}</span>
    </Link>
  );
}

function DirectoryLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link className="group -mx-space-sm flex items-center gap-space-md rounded-control px-space-sm py-space-md transition-colors hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href={href}>
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-base text-primary">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block font-body text-label-lg font-semibold text-text-primary">{title}</strong>
        <span className="mt-0.5 block font-body text-body-sm text-text-muted">{description}</span>
      </span>
      <Icon className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" name="chevron_right" size={18} />
    </Link>
  );
}
