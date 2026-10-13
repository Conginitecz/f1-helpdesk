"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { apiRequest, ApiError } from "@/lib/api";

interface Partner {
  id: number;
  partner_type_id: number;
}

interface StatusRequest {
  id: number;
  status: string;
}

interface Counts {
  locations: number;
  admins: number;
  partners: number;
  pendingRequests: number;
}

export default function SuperAdminArea() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCounts() {
    setLoading(true);
    setError("");
    try {
      const [locations, admins, vendors, engineers, requests] = await Promise.all([
        apiRequest<unknown[]>("/super-admin/locations"),
        apiRequest<unknown[]>("/super-admin/admins"),
        apiRequest<Partner[]>("/super-admin/partners?type=vendor"),
        apiRequest<Partner[]>("/super-admin/partners?type=engineer"),
        apiRequest<StatusRequest[]>("/super-admin/status-requests"),
      ]);
      setCounts({
        locations: locations.length,
        admins: admins.length,
        partners: vendors.length + engineers.length,
        pendingRequests: requests.filter((request) => request.status === "pending").length,
      });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not load dashboard counts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadCounts());
  }, []);

  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">OVERVIEW</p>
        <h1>Dashboard</h1>
        <p>Account and service activity across your locations.</p>
      </div>
      {loading ? (
        <ScreenState kind="loading" message="Loading dashboard…" />
      ) : error ? (
        <ScreenState kind="error" message={error} onRetry={() => void loadCounts()} />
      ) : counts ? (
        <>
          <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-4">
            <Count label="Locations" value={counts.locations} href="/super-admin/locations-admins" />
            <Count label="Admins" value={counts.admins} href="/super-admin/locations-admins" />
            <Count label="Partners" value={counts.partners} href="/super-admin/partners" />
            <Count label="Pending requests" value={counts.pendingRequests} href="/super-admin/status-requests" />
          </div>
          {counts.locations + counts.admins + counts.partners + counts.pendingRequests === 0 && (
            <ScreenState kind="empty" message="No activity to show yet." />
          )}
        </>
      ) : (
        <ScreenState kind="empty" message="Dashboard counts are not available." />
      )}
    </RoleShell>
  );
}

function Count({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link className="rounded-panel border border-border-subtle bg-surface-card p-space-md shadow-level-1 transition-colors hover:bg-surface-base" href={href}>
      <span className="block font-body text-label-md text-text-muted">{label}</span>
      <strong className="mt-1 block font-headline text-headline-lg tabular-nums text-text-primary">{value}</strong>
    </Link>
  );
}
