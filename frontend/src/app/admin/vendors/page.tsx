"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerForm, type PartnerFormPayload } from "@/components/admin/partner-form";
import type { AdminPartner } from "@/components/admin/types";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/data-table";
import { Notice } from "@/components/ui/notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest, ApiError } from "@/lib/api";

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVendors(await apiRequest<AdminPartner[]>("/admin/partners?type=vendor"));
    } catch (reason) {
      setError(messageFor(reason, "Could not load vendors."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadVendors());
  }, [loadVendors]);

  async function createVendor(payload: PartnerFormPayload) {
    setSaving(true);
    setNotice("");
    try {
      const vendor = await apiRequest<AdminPartner>("/admin/partners", {
        method: "POST",
        body: JSON.stringify({ ...payload, type: "vendor" }),
      });
      setNotice(`Vendor ${vendor.name} created.`);
      await loadVendors();
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleShell role="admin">
      <div className="mb-space-xl border-b border-border-subtle pb-space-lg">
        <p className="mb-space-xs font-mono text-data-mono-sm font-semibold uppercase text-accent-teal">Partner directory</p>
        <h1 className="font-headline text-headline-xl text-text-primary">Vendors</h1>
        <p className="mt-space-xs font-body text-body-md text-text-muted">Vendors onboarded by your admin account.</p>
      </div>
      {notice && <Notice className="mb-space-md">{notice}</Notice>}
      <PartnerForm kind="vendor" onSubmit={createVendor} saving={saving} />
      <section className="mt-space-xl" aria-labelledby="vendors-list-title">
        <div className="mb-space-sm flex items-end justify-between gap-space-md">
          <div>
            <p className="mb-space-xs font-mono text-data-mono-sm font-semibold uppercase text-text-muted">Your directory</p>
            <h2 className="font-headline text-headline-md text-text-primary" id="vendors-list-title">Vendor records</h2>
          </div>
          {!loading && !error && (
            <span className="rounded-pill bg-surface-variant px-space-sm py-space-xs font-mono text-data-mono-sm tabular-nums text-text-primary">
              {vendors.length}
            </span>
          )}
        </div>
        {loading ? <ScreenState kind="loading" message="Loading your vendors…" /> : error ? (
          <ScreenState kind="error" message={error} onRetry={() => void loadVendors()} />
        ) : vendors.length === 0 ? <ScreenState kind="empty" message="You have not added any vendors yet." /> : (
          <TableWrap>
            <Table>
              <thead><Tr><Th>Vendor</Th><Th>Type</Th><Th>Phone</Th><Th>Email</Th><Th className="hidden lg:table-cell">Address</Th><Th>Status</Th><Th>Created</Th><Th aria-label="Actions" /></Tr></thead>
              <tbody>{vendors.map((vendor) => (
                <Tr key={vendor.id}>
                  <Td><strong className="font-medium text-text-primary">{vendor.name}</strong><span className="mt-0.5 block font-mono text-data-mono-sm text-text-muted">ID {vendor.id}</span></Td>
                  <Td><StatusBadge status="neutral">Vendor</StatusBadge></Td>
                  <Td>{vendor.phone_number}</Td>
                  <Td>{vendor.email ?? "—"}</Td>
                  <Td className="hidden lg:table-cell">{vendor.address ?? "—"}</Td>
                  <Td><StatusBadge status={vendor.is_active && !vendor.is_deleted ? "active" : "inactive"}>{vendor.is_active && !vendor.is_deleted ? "Active" : "Inactive"}</StatusBadge></Td>
                  <Td>{formatDate(vendor.created_at)}</Td>
                  <Td><Button className="whitespace-nowrap" variant="secondary" size="compact" onClick={() => router.push(`/admin/engineers?vendorId=${vendor.id}`)} type="button">Add engineer</Button></Td>
                </Tr>
              ))}</tbody>
            </Table>
          </TableWrap>
        )}
      </section>
    </RoleShell>
  );
}

function messageFor(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}