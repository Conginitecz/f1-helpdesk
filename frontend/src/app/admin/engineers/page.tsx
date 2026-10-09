"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PartnerForm, type PartnerFormPayload } from "@/components/admin/partner-form";
import type { AdminLookup, AdminPartner, StatusRequest } from "@/components/admin/types";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { apiRequest, ApiError } from "@/lib/api";

const VENDOR_REFERENCE_CODE = "d6Rq1Ae3Uv9sH5pM";

export default function AdminEngineersPage() {
  const [engineers, setEngineers] = useState<AdminPartner[]>([]);
  const [vendors, setVendors] = useState<AdminPartner[]>([]);
  const [skills, setSkills] = useState<AdminLookup[]>([]);
  const [categories, setCategories] = useState<AdminLookup[]>([]);
  const [vendorReferenceTypeId, setVendorReferenceTypeId] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [requestStatuses, setRequestStatuses] = useState<Record<number, StatusRequest>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const queryVendorResolved = useRef(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [engineerRows, vendorRows, skillRows, categoryRows, referenceRows] = await Promise.all([
        apiRequest<AdminPartner[]>("/admin/partners?type=engineer"),
        apiRequest<AdminPartner[]>("/admin/partners?type=vendor"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=service_engineer_skill"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=service_engineer_category"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=reference_type"),
      ]);
      setEngineers(engineerRows);
      setVendors(vendorRows);
      setSkills(skillRows);
      setCategories(categoryRows);
      setVendorReferenceTypeId(referenceRows.find((row) => row.text === VENDOR_REFERENCE_CODE)?.id ?? null);
      if (!queryVendorResolved.current) {
        const requestedVendor = new URLSearchParams(window.location.search).get("vendorId");
        setSelectedVendorId(requestedVendor && vendorRows.some((vendor) => vendor.id === Number(requestedVendor)) ? requestedVendor : "");
        queryVendorResolved.current = true;
      }
    } catch (reason) {
      setError(messageFor(reason, "Could not load engineers and form options."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadPage());
  }, [loadPage]);

  async function createEngineer(payload: PartnerFormPayload) {
    setSaving(true);
    setNotice("");
    try {
      const body = selectedVendorId ? payload : { ...payload, type: "engineer" };
      const path = selectedVendorId
        ? `/admin/partners/${selectedVendorId}/service-engineers`
        : "/admin/partners";
      const engineer = await apiRequest<AdminPartner>(path, { method: "POST", body: JSON.stringify(body) });
      setNotice(`Service engineer ${engineer.name} created.`);
      await loadPage();
    } finally {
      setSaving(false);
    }
  }

  async function requestStatusChange(engineer: AdminPartner) {
    const action = engineer.is_active ? "deactivate" : "activate";
    const actionLabel = action === "deactivate" ? "deactivation" : "activation";
    if (!window.confirm(`Request ${actionLabel} for ${engineer.name}? The engineer's active state will not change until the request is resolved.`)) return;

    setRequestingId(engineer.id);
    setNotice("");
    try {
      const request = await apiRequest<StatusRequest>(`/admin/partners/${engineer.id}/request-status-change`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setRequestStatuses((current) => ({ ...current, [engineer.id]: request }));
      setNotice(`Request ${request.id} submitted: ${request.status}.`);
    } catch (reason) {
      setNotice("");
      setError(messageFor(reason, "Could not submit the status request."));
    } finally {
      setRequestingId(null);
    }
  }

  function ownerFor(engineer: AdminPartner): string {
    if (engineer.reference_type_id !== vendorReferenceTypeId) return "Direct admin";
    return vendors.find((vendor) => vendor.id === engineer.reference_id)?.name ?? `Vendor #${engineer.reference_id}`;
  }

  return (
    <RoleShell role="admin">
      <div className="page-heading">
        <p className="eyebrow">PEOPLE</p>
        <h1>Service engineers</h1>
        <p>Direct engineers and engineers registered under your vendors.</p>
      </div>
      {notice && <p className="success-message" role="status">{notice}</p>}
      {error && <div className="inline-error" role="alert"><span>{error}</span><button className="text-button" onClick={() => void loadPage()} type="button">Retry loading</button></div>}
      {loading ? <ScreenState kind="loading" message="Loading engineers and options…" /> : !error && (
        <>
          <label className="field-label admin-vendor-select" htmlFor="engineer-vendor">Owner<select id="engineer-vendor" onChange={(event) => setSelectedVendorId(event.target.value)} value={selectedVendorId}><option value="">Direct admin</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
          <PartnerForm categories={categories} kind="engineer" onSubmit={createEngineer} saving={saving} skills={skills} vendorName={vendors.find((vendor) => String(vendor.id) === selectedVendorId)?.name} />
          <section className="inventory-list-section admin-directory" aria-labelledby="engineers-list-title">
            <div className="inventory-list-heading">
              <div><p className="eyebrow">YOUR DIRECTORY</p><h2 id="engineers-list-title">Engineers</h2></div>
              <span className="section-count">{engineers.length}</span>
            </div>
            {engineers.length === 0 ? <ScreenState kind="empty" message="You have not added any service engineers yet." /> : (
              <div className="table-wrap admin-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Engineer</th><th>Type</th><th>Owner</th><th>Phone</th><th>Skill</th><th>Category</th><th>Status</th><th>Request status</th><th /></tr></thead>
                  <tbody>{engineers.map((engineer) => {
                    const request = requestStatuses[engineer.id];
                    return (
                      <tr key={engineer.id}>
                        <td><strong>{engineer.name}</strong><span className="cell-secondary">ID {engineer.id}</span></td>
                        <td><span className="type-pill">Service engineer</span></td>
                        <td>{ownerFor(engineer)}</td>
                        <td>{engineer.phone_number}</td>
                        <td>{lookupLabel(skills, engineer.skill_id)}</td>
                        <td>{lookupLabel(categories, engineer.category_id)}</td>
                        <td><span className={engineer.is_active && !engineer.is_deleted ? "status-pill status-active" : "status-pill status-inactive"}>{engineer.is_active && !engineer.is_deleted ? "Active" : "Inactive"}</span></td>
                        <td>{request ? <span className={`status-pill status-${request.status}`}>{request.status === "pending" ? "Pending approval" : request.status} ({request.requested_action})</span> : "—"}</td>
                        <td><button className="secondary-button compact-button" disabled={requestingId === engineer.id || request?.status === "pending"} onClick={() => void requestStatusChange(engineer)} type="button">{requestingId === engineer.id ? "Submitting…" : request?.status === "pending" ? "Pending approval" : engineer.is_active ? "Request deactivation" : "Request activation"}</button></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </RoleShell>
  );
}

function lookupLabel(rows: AdminLookup[], id: number | null): string {
  return id === null ? "—" : rows.find((row) => row.id === id)?.text ?? `Lookup #${id}`;
}

function messageFor(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback;
}