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
      <div className="page-heading">
        <p className="eyebrow">PARTNER DIRECTORY</p>
        <h1>Vendors</h1>
        <p>Vendors onboarded by your admin account.</p>
      </div>
      {notice && <Notice>{notice}</Notice>}
      <PartnerForm kind="vendor" onSubmit={createVendor} saving={saving} />
      <section className="inventory-list-section admin-directory" aria-labelledby="vendors-list-title">
        <div className="inventory-list-heading">
          <div><p className="eyebrow">YOUR DIRECTORY</p><h2 id="vendors-list-title">Vendors</h2></div>
          {!loading && !error && <span className="section-count">{vendors.length}</span>}
        </div>
        {loading ? <ScreenState kind="loading" message="Loading your vendors…" /> : error ? (
          <ScreenState kind="error" message={error} onRetry={() => void loadVendors()} />
        ) : vendors.length === 0 ? <ScreenState kind="empty" message="You have not added any vendors yet." /> : (
          <TableWrap className="admin-table-wrap">
            <Table>
              <thead><Tr><Th>Vendor</Th><Th>Type</Th><Th>Phone</Th><Th>Email</Th><Th>Address</Th><Th>Status</Th><Th>Created</Th><Th /></Tr></thead>
              <tbody>{vendors.map((vendor) => (
                <Tr key={vendor.id}>
                  <Td><strong className="font-medium text-text-primary">{vendor.name}</strong><span className="mt-0.5 block font-mono text-data-mono-sm text-text-muted">ID {vendor.id}</span></Td>
                  <Td><StatusBadge status="neutral">Vendor</StatusBadge></Td>
                  <Td>{vendor.phone_number}</Td>
                  <Td>{vendor.email ?? "—"}</Td>
                  <Td>{vendor.address ?? "—"}</Td>
                  <Td><StatusBadge status={vendor.is_active && !vendor.is_deleted ? "active" : "inactive"}>{vendor.is_active && !vendor.is_deleted ? "Active" : "Inactive"}</StatusBadge></Td>
                  <Td>{formatDate(vendor.created_at)}</Td>
                  <Td><Button variant="secondary" size="compact" onClick={() => router.push(`/admin/engineers?vendorId=${vendor.id}`)} type="button">Add engineer</Button></Td>
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