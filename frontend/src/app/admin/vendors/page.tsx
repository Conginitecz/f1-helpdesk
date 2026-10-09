"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PartnerForm, type PartnerFormPayload } from "@/components/admin/partner-form";
import type { AdminPartner } from "@/components/admin/types";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { apiRequest, ApiError } from "@/lib/api";

export default function AdminVendorsPage() {
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
      {notice && <p className="success-message" role="status">{notice}</p>}
      <PartnerForm kind="vendor" onSubmit={createVendor} saving={saving} />
      <section className="inventory-list-section admin-directory" aria-labelledby="vendors-list-title">
        <div className="inventory-list-heading">
          <div><p className="eyebrow">YOUR DIRECTORY</p><h2 id="vendors-list-title">Vendors</h2></div>
          {!loading && !error && <span className="section-count">{vendors.length}</span>}
        </div>
        {loading ? <ScreenState kind="loading" message="Loading your vendors…" /> : error ? (
          <ScreenState kind="error" message={error} onRetry={() => void loadVendors()} />
        ) : vendors.length === 0 ? <ScreenState kind="empty" message="You have not added any vendors yet." /> : (
          <div className="table-wrap admin-table-wrap">
            <table className="data-table">
              <thead><tr><th>Vendor</th><th>Type</th><th>Phone</th><th>Email</th><th>Address</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>{vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td><strong>{vendor.name}</strong><span className="cell-secondary">ID {vendor.id}</span></td>
                  <td><span className="type-pill">Vendor</span></td>
                  <td>{vendor.phone_number}</td>
                  <td>{vendor.email ?? "—"}</td>
                  <td>{vendor.address ?? "—"}</td>
                  <td><span className={vendor.is_active && !vendor.is_deleted ? "status-pill status-active" : "status-pill status-inactive"}>{vendor.is_active && !vendor.is_deleted ? "Active" : "Inactive"}</span></td>
                  <td>{formatDate(vendor.created_at)}</td>
                  <td><Link className="secondary-button compact-button" href={`/admin/engineers?vendorId=${vendor.id}`}>Add engineer</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
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