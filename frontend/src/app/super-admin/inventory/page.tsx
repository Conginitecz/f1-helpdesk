"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { InventoryForm, type InventoryPayload } from "@/components/inventory/inventory-form";
import { InventoryList } from "@/components/inventory/inventory-list";
import type { InventoryCreator, InventoryItem, InventoryLocation, InventoryLookup } from "@/components/inventory/types";
import { apiRequest, ApiError } from "@/lib/api";
import { Notice } from "@/components/ui/notice";

export default function SuperAdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [admins, setAdmins] = useState<InventoryCreator[]>([]);
  const [types, setTypes] = useState<InventoryLookup[]>([]);
  const [categories, setCategories] = useState<InventoryLookup[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [screenLoading, setScreenLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [screenError, setScreenError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadScreenData = useCallback(async () => {
    setScreenLoading(true);
    setScreenError("");
    try {
      const [locationRows, adminRows, typeRows, categoryRows] = await Promise.all([
        apiRequest<InventoryLocation[]>("/super-admin/locations"),
        apiRequest<InventoryCreator[]>("/super-admin/admins"),
        apiRequest<InventoryLookup[]>("/super-admin/master-data?type=inventory_type"),
        apiRequest<InventoryLookup[]>("/super-admin/master-data?type=inventory_category"),
      ]);
      setLocations(locationRows);
      setAdmins(adminRows);
      setTypes(typeRows.filter((row) => row.is_active));
      setCategories(categoryRows.filter((row) => row.is_active));
    } catch (reason) {
      setScreenError(reason instanceof ApiError ? reason.message : "Could not load inventory options.");
    } finally {
      setScreenLoading(false);
    }
  }, []);

  const loadInventory = useCallback(async (locationId: string) => {
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const query = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";
      const rows = await apiRequest<InventoryItem[]>(`/super-admin/inventory${query}`);
      setItems(rows);
    } catch (reason) {
      setInventoryError(reason instanceof ApiError ? reason.message : "Could not load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadScreenData();
      void loadInventory("");
    });
  }, [loadInventory, loadScreenData]);

  async function saveItem(payload: InventoryPayload) {
    setSaving(true);
    setNotice("");
    try {
      if (selectedItem) {
        await apiRequest<InventoryItem>(`/super-admin/inventory/${selectedItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice(`Inventory item “${payload.name}” updated.`);
      } else {
        await apiRequest<InventoryItem>("/super-admin/inventory", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice(`Inventory item “${payload.name}” created.`);
      }
      setSelectedItem(null);
      await loadInventory(selectedLocation);
    } finally {
      setSaving(false);
    }
  }

  function changeLocation(locationId: string) {
    setSelectedLocation(locationId);
    void loadInventory(locationId);
  }

  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">STOCK CONTROL</p>
        <h1>Inventory</h1>
        <p>Track stock, pricing and location across the network.</p>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {screenError ? <ScreenState kind="error" message={screenError} onRetry={() => void loadScreenData()} /> : screenLoading ? (
        <ScreenState kind="loading" message="Loading locations and lookup options…" />
      ) : (
        <InventoryForm
          categories={categories}
          initialItem={selectedItem}
          locationControl={{ mode: "select", locations }}
          onCancelEdit={() => setSelectedItem(null)}
          onSubmit={saveItem}
          saving={saving}
          types={types}
        />
      )}
      {!screenLoading && !screenError && (
        <InventoryList
          admins={admins}
          categories={categories}
          error={inventoryError}
          items={items}
          loading={inventoryLoading}
          locations={locations}
          onEdit={setSelectedItem}
          onLocationChange={changeLocation}
          onRetry={() => void loadInventory(selectedLocation)}
          selectedLocation={selectedLocation}
          types={types}
        />
      )}
    </RoleShell>
  );
}
