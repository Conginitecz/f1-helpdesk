"use client";

import { useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { apiRequest, ApiError } from "@/lib/api";

interface Partner {
  id: number;
  partner_type_id: number;
  name: string;
  created_by_admin_id: number;
  is_active: boolean;
  is_deleted: boolean;
}

interface AdminRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location_id: number | null;
}

interface LocationRow {
  id: number;
  name: string;
}

interface MasterDataRow {
  id: number;
  type: string;
  text: string;
}

const partnerTypeLabels: Record<string, string> = {
  q7Kf2mZ9xRw4tB6y: "Vendor",
  h3Np8Ld1Qs5Vc2Jw: "Service engineer",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [typeCodes, setTypeCodes] = useState<MasterDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPartners() {
    setLoading(true);
    setError("");
    try {
      const [vendors, engineers, adminRows, locationRows, masterRows] = await Promise.all([
        apiRequest<Partner[]>("/super-admin/partners?type=vendor"),
        apiRequest<Partner[]>("/super-admin/partners?type=engineer"),
        apiRequest<AdminRow[]>("/super-admin/admins"),
        apiRequest<LocationRow[]>("/super-admin/locations"),
        apiRequest<MasterDataRow[]>("/super-admin/master-data?type=partner_type"),
      ]);
      setPartners([...vendors, ...engineers].sort((left, right) => left.id - right.id));
      setAdmins(adminRows);
      setLocations(locationRows);
      setTypeCodes(masterRows);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not load partners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadPartners());
  }, []);

  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">DIRECTORY</p>
        <h1>Partners</h1>
        <p>Vendors and service engineers registered across all admins.</p>
      </div>
      {loading ? <ScreenState kind="loading" message="Loading partner directory…" /> : error ? (
        <ScreenState kind="error" message={error} onRetry={() => void loadPartners()} />
      ) : partners.length === 0 ? <ScreenState kind="empty" message="No vendors or engineers have been added yet." /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Owner admin</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>{partners.map((partner) => {
              const owner = admins.find((admin) => admin.id === partner.created_by_admin_id);
              const masterRow = typeCodes.find((row) => row.id === partner.partner_type_id);
              const typeLabel = masterRow ? partnerTypeLabels[masterRow.text] ?? "Partner" : "Unknown";
              const locationName = locations.find((location) => location.id === owner?.location_id)?.name ?? "Unassigned";
              return (
                <tr key={partner.id}>
                  <td><strong>{partner.name}</strong><span className="cell-secondary">ID {partner.id}</span></td>
                  <td><span className="type-pill">{typeLabel}</span></td>
                  <td>{owner ? `${owner.first_name} ${owner.last_name}` : "Unknown admin"}<span className="cell-secondary">{owner?.email ?? `Admin #${partner.created_by_admin_id}`}</span></td>
                  <td>{locationName}</td>
                  <td><span className={partner.is_active && !partner.is_deleted ? "status-pill status-active" : "status-pill status-inactive"}>{partner.is_active && !partner.is_deleted ? "Active" : "Inactive"}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </RoleShell>
  );
}
