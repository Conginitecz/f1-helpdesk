"use client";

import { ScreenState } from "@/components/screen-state";
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
        {!assignedMode && <label className="inventory-filter" htmlFor="inventory-location-filter">
            Location
            <select id="inventory-location-filter" onChange={(event) => onLocationChange(event.target.value)} value={selectedLocation}>
              <option value="">All locations</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>}
      </div>
      {loading ? <ScreenState kind="loading" message="Loading inventory…" /> : error ? (
        <ScreenState kind="error" message={error} onRetry={onRetry} />
      ) : items.length === 0 ? <ScreenState kind="empty" message="No inventory items match this view." /> : (
        <div className="table-wrap inventory-table-wrap">
          <table className="data-table inventory-table">
            <thead><tr><th>Item</th><th>Type</th><th>Category</th><th>Units</th><th>Price / unit</th><th>Tax</th><th>Location</th>{!assignedMode && <th>Creator</th>}<th>Status</th>{!assignedMode && <th />}</tr></thead>
            <tbody>{items.map((item) => {
              const creator = item.created_by_admin_id === null ? null : admins.find((admin) => admin.id === item.created_by_admin_id);
              return (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><span className="cell-secondary">ID {item.id}</span></td>
                  <td>{lookupLabel(types, item.type_id)}</td>
                  <td>{lookupLabel(categories, item.category_id)}</td>
                  <td>{item.units}</td>
                  <td>{formatMoney(item.price_per_unit)}</td>
                  <td>{item.tax_applicable ? `${item.tax_percentage ?? "0"}%` : "No tax"}</td>
                  <td>{assignedMode ? `Location #${item.location_id}` : locations.find((location) => location.id === item.location_id)?.name ?? `Location #${item.location_id}`}</td>
                  {!assignedMode && <td>{creator ? `${creator.first_name} ${creator.last_name}` : `Super admin #${item.created_by_super_admin_id ?? "?"}`}</td>}
                  <td><span className={item.is_active ? "status-pill status-active" : "status-pill status-inactive"}>{item.is_active ? "Active" : "Inactive"}</span></td>
                  {!assignedMode && <td><button className="secondary-button compact-button" onClick={() => onEdit(item)} type="button">Edit</button></td>}
                </tr>
              );
            })}</tbody>
          </table>
        </div>
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
