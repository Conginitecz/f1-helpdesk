"use client";

import { useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiError } from "@/lib/api";

interface StatusRequest {
  id: number;
  entity_type: string;
  entity_id: number;
  requested_action: string;
  requested_by_admin_id: number;
  status: string;
  resolved_by_super_admin_id: number | null;
  created_at: string;
}

interface Partner {
  id: number;
  name: string;
  is_active: boolean;
}

interface AdminRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function StatusRequestsPage() {
  const [requests, setRequests] = useState<StatusRequest[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const [requestRows, vendors, engineers, adminRows] = await Promise.all([
        apiRequest<StatusRequest[]>("/super-admin/status-requests"),
        apiRequest<Partner[]>("/super-admin/partners?type=vendor"),
        apiRequest<Partner[]>("/super-admin/partners?type=engineer"),
        apiRequest<AdminRow[]>("/super-admin/admins"),
      ]);
      setRequests(requestRows.filter((request) => request.requested_action === "deactivate"));
      setPartners([...vendors, ...engineers]);
      setAdmins(adminRows);
    } catch (reason) {
      setError(messageFor(reason, "Could not load status requests."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadRequests());
  }, []);

  async function resolveRequest(request: StatusRequest, action: "approve" | "reject") {
    const verb = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} deactivation request #${request.id}?`)) return;
    setActionError("");
    setNotice("");
    setBusyId(request.id);
    try {
      await apiRequest<StatusRequest>(`/super-admin/status-requests/${request.id}/${action}`, { method: "PATCH" });
      setNotice(`Request #${request.id} ${action === "approve" ? "approved" : "rejected"}.`);
      await loadRequests();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        setActionError(`Request #${request.id} was already resolved. The list has been refreshed.`);
        await loadRequests();
      } else {
        setActionError(messageFor(reason, "Could not resolve this request."));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">REVIEW QUEUE</p>
        <h1>Status requests</h1>
        <p>Review admin-submitted deactivation requests.</p>
      </div>
      {notice && <p className="success-message" role="status">{notice}</p>}
      {actionError && <p className="form-error action-message" role="alert">{actionError}</p>}
      {loading ? <ScreenState kind="loading" message="Loading status requests…" /> : error ? (
        <ScreenState kind="error" message={error} onRetry={() => void loadRequests()} />
      ) : requests.length === 0 ? <ScreenState kind="empty" message="There are no deactivation requests yet." /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Engineer</th><th>Requested by</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{requests.map((request) => {
              const partner = partners.find((item) => item.id === request.entity_id);
              const admin = admins.find((item) => item.id === request.requested_by_admin_id);
              return (
                <tr key={request.id}>
                  <td><strong>{partner?.name ?? `Partner #${request.entity_id}`}</strong><span className="cell-secondary">Request #{request.id} · Deactivation</span></td>
                  <td>{admin ? `${admin.first_name} ${admin.last_name}` : `Admin #${request.requested_by_admin_id}`}<span className="cell-secondary">{admin?.email ?? ""}</span></td>
                  <td>{new Date(request.created_at).toLocaleDateString()}</td>
                  <td><span className={`status-pill status-${request.status}`}>{request.status}</span></td>
                  <td>{request.status === "pending" ? <div className="row-actions"><Button size="compact" disabled={busyId === request.id} onClick={() => void resolveRequest(request, "approve")} type="button">Approve</Button><Button size="compact" variant="secondary" disabled={busyId === request.id} onClick={() => void resolveRequest(request, "reject")} type="button">Reject</Button></div> : <span className="cell-secondary">Resolved</span>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </RoleShell>
  );
}

function messageFor(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback;
}
