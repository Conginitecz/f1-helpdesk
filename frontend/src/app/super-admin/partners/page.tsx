"use client";

import { useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/data-table";
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
        <TableWrap>
          <Table>
            <thead><Tr><Th>Name</Th><Th>Type</Th><Th>Owner admin</Th><Th>Location</Th><Th>Status</Th></Tr></thead>
            <tbody>{partners.map((partner) => {
              const owner = admins.find((admin) => admin.id === partner.created_by_admin_id);
              const masterRow = typeCodes.find((row) => row.id === partner.partner_type_id);
              const typeLabel = masterRow ? partnerTypeLabels[masterRow.text] ?? "Partner" : "Unknown";
              const locationName = locations.find((location) => location.id === owner?.location_id)?.name ?? "Unassigned";
              return (
                <Tr key={partner.id}>
                  <Td><strong className="font-medium text-text-primary">{partner.name}</strong><span className="mt-0.5 block font-mono text-data-mono-sm text-text-muted">ID {partner.id}</span></Td>
                  <Td><StatusBadge status="neutral">{typeLabel}</StatusBadge></Td>
                  <Td>{owner ? `${owner.first_name} ${owner.last_name}` : "Unknown admin"}<span className="mt-0.5 block font-body text-body-sm text-text-muted">{owner?.email ?? `Admin #${partner.created_by_admin_id}`}</span></Td>
                  <Td>{locationName}</Td>
                  <Td><StatusBadge status={partner.is_active && !partner.is_deleted ? "active" : "inactive"}>{partner.is_active && !partner.is_deleted ? "Active" : "Inactive"}</StatusBadge></Td>
                </Tr>
              );
            })}</tbody>
          </Table>
        </TableWrap>
      )}
    </RoleShell>
  );
}
