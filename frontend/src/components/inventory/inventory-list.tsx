"use client";

import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { MonoTd, Table, TableWrap, Td, Th, Tr } from "@/components/ui/data-table";
import { SelectField } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InventoryCreator, InventoryItem, InventoryLocation, InventoryLookup } from "./types";

interface InventoryListProps {
  items: InventoryItem[];
  locations: InventoryLocation[];
  admins: InventoryCreator[];
  types: InventoryLookup[];
  categories: InventoryLookup[];
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  onEdit: (item: InventoryItem) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  mode?: "network" | "assigned";
}

export function InventoryList({
  items,
  locations,
  admins,
  types,
  categories,
  selectedLocation,
  onLocationChange,
  onEdit,
  loading,
  error,
  onRetry,
  mode = "network",
}: InventoryListProps) {
  const assignedMode = mode === "assigned";
  return (
    <section className="inventory-list-section" aria-labelledby="inventory-list-title">
      <div className="inventory-list-heading">
        <div><p className="eyebrow">STOCK REGISTER</p><h2 id="inventory-list-title">Inventory items</h2></div>
        {!assignedMode && <SelectField className="inventory-filter" label="Location" name="inventory-location-filter" onChange={(event) => onLocationChange(event.target.value)} value={selectedLocation}>
            <option value="">All locations</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </SelectField>}
      </div>
      {loading ? <ScreenState kind="loading" message="Loading inventory…" /> : error ? (
        <ScreenState kind="error" message={error} onRetry={onRetry} />
      ) : items.length === 0 ? <ScreenState kind="empty" message="No inventory items match this view." /> : (
        <TableWrap className="inventory-table-wrap">
          <Table>
            <thead><Tr><Th>Item</Th><Th>Type</Th><Th>Category</Th><Th>Units</Th><Th>Price / unit</Th><Th>Tax</Th><Th>Location</Th>{!assignedMode && <Th>Creator</Th>}<Th>Status</Th>{!assignedMode && <Th />}</Tr></thead>
            <tbody>{items.map((item) => {
              const creator = item.created_by_admin_id === null ? null : admins.find((admin) => admin.id === item.created_by_admin_id);
              return (
                <Tr key={item.id}>
                  <Td><strong className="font-medium text-text-primary">{item.name}</strong><span className="mt-0.5 block font-mono text-data-mono-sm text-text-muted">ID {item.id}</span></Td>
                  <Td>{lookupLabel(types, item.type_id)}</Td>
                  <Td>{lookupLabel(categories, item.category_id)}</Td>
                  <MonoTd>{item.units}</MonoTd>
                  <MonoTd>{formatMoney(item.price_per_unit)}</MonoTd>
                  <Td>{item.tax_applicable ? `${item.tax_percentage ?? "0"}%` : "No tax"}</Td>
                  <Td>{item.location_name || locations.find((location) => location.id === item.location_id)?.name || <span className="font-mono text-data-mono-sm">Location #{item.location_id}</span>}</Td>
                  {!assignedMode && <Td>{creator ? `${creator.first_name} ${creator.last_name}` : <span className="font-mono text-data-mono-sm">Super admin #{item.created_by_super_admin_id ?? "?"}</span>}</Td>}
                  <Td><StatusBadge status={item.is_active ? "active" : "inactive"}>{item.is_active ? "Active" : "Inactive"}</StatusBadge></Td>
                  {!assignedMode && <Td><Button variant="secondary" size="compact" onClick={() => onEdit(item)} type="button">Edit</Button></Td>}
                </Tr>
              );
            })}</tbody>
          </Table>
        </TableWrap>
      )}
    </section>
  );
}

function lookupLabel(rows: InventoryLookup[], id: number | null): string {
  if (id === null) return "—";
  return rows.find((row) => row.id === id)?.text ?? `Lookup #${id}`;
}

function formatMoney(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : value;
}
