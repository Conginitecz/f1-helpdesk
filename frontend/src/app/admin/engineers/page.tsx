"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PartnerForm, type PartnerFormPayload } from "@/components/admin/partner-form";
import type { AdminLookup, AdminPartner, StatusRequest } from "@/components/admin/types";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/data-table";
import { SelectField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { StatusBadge } from "@/components/ui/status-badge";
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
      const [engineerRows, vendorRows, skillRows, categoryRows, referenceRows, requestRows] = await Promise.all([
        apiRequest<AdminPartner[]>("/admin/partners?type=engineer"),
        apiRequest<AdminPartner[]>("/admin/partners?type=vendor"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=service_engineer_skill"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=service_engineer_category"),
        apiRequest<AdminLookup[]>("/admin/master-data?type=reference_type"),
        apiRequest<StatusRequest[]>("/admin/status-requests"),
      ]);
      setEngineers(engineerRows);
      setVendors(vendorRows);
      setSkills(skillRows);
      setCategories(categoryRows);
      setVendorReferenceTypeId(referenceRows.find((row) => row.text === VENDOR_REFERENCE_CODE)?.id ?? null);
      const statuses: Record<number, StatusRequest> = {};
      for (const request of requestRows) {
        if (request.requested_action === "deactivate" && statuses[request.entity_id] === undefined) {
          statuses[request.entity_id] = request;
        }
      }
      setRequestStatuses(statuses);
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
      setNotice(`Request ${request.id} submitted: ${request.status}.`);
      await loadPage();
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
      {notice && <Notice>{notice}</Notice>}
      {error && <Notice tone="error"><span>{error}</span><Button variant="ghost" size="compact" onClick={() => void loadPage()} type="button">Retry loading</Button></Notice>}
      {loading ? <ScreenState kind="loading" message="Loading engineers and options…" /> : !error && (
        <>
          <SelectField className="admin-vendor-select" label="Owner" name="engineer-vendor" onChange={(event) => setSelectedVendorId(event.target.value)} value={selectedVendorId}><option value="">Direct admin</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</SelectField>
          <PartnerForm categories={categories} kind="engineer" onSubmit={createEngineer} saving={saving} skills={skills} vendorName={vendors.find((vendor) => String(vendor.id) === selectedVendorId)?.name} />
          <section className="inventory-list-section admin-directory" aria-labelledby="engineers-list-title">
            <div className="inventory-list-heading">
              <div><p className="eyebrow">YOUR DIRECTORY</p><h2 id="engineers-list-title">Engineers</h2></div>
              <span className="section-count">{engineers.length}</span>
            </div>
            {engineers.length === 0 ? <ScreenState kind="empty" message="You have not added any service engineers yet." /> : (
              <TableWrap className="admin-table-wrap">
                <Table>
                  <thead><Tr><Th>Engineer</Th><Th>Type</Th><Th>Owner</Th><Th>Phone</Th><Th>Skill</Th><Th>Category</Th><Th>Status</Th><Th>Request status</Th><Th /></Tr></thead>
                  <tbody>{engineers.map((engineer) => {
                    const request = requestStatuses[engineer.id];
                    return (
                      <Tr key={engineer.id}>
                        <Td><strong className="font-medium text-text-primary">{engineer.name}</strong><span className="mt-0.5 block font-mono text-data-mono-sm text-text-muted">ID {engineer.id}</span></Td>
                        <Td><StatusBadge status="neutral">Service engineer</StatusBadge></Td>
                        <Td>{ownerFor(engineer)}</Td>
                        <Td>{engineer.phone_number}</Td>
                        <Td>{lookupLabel(skills, engineer.skill_id)}</Td>
                        <Td>{lookupLabel(categories, engineer.category_id)}</Td>
                        <Td><StatusBadge status={engineer.is_active && !engineer.is_deleted ? "active" : "inactive"}>{engineer.is_active && !engineer.is_deleted ? "Active" : "Inactive"}</StatusBadge></Td>
                        <Td>{request ? <StatusBadge status={request.status}>{request.status === "pending" ? "Pending approval" : request.status} ({request.requested_action})</StatusBadge> : "—"}</Td>
                        <Td><Button variant="secondary" size="compact" disabled={requestingId === engineer.id || request?.status === "pending"} onClick={() => void requestStatusChange(engineer)} type="button">{requestingId === engineer.id ? "Submitting…" : request?.status === "pending" ? "Pending approval" : engineer.is_active ? "Request deactivation" : "Request activation"}</Button></Td>
                      </Tr>
                    );
                  })}</tbody>
                </Table>
              </TableWrap>
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