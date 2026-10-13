"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleShell } from "@/components/role-shell";
import { InventoryForm, type InventoryPayload } from "@/components/inventory/inventory-form";
import { InventoryList } from "@/components/inventory/inventory-list";
import type { InventoryItem, InventoryLookup } from "@/components/inventory/types";
import { ScreenState } from "@/components/screen-state";
import { Notice } from "@/components/ui/notice";
import { apiRequest, ApiError } from "@/lib/api";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [types, setTypes] = useState<InventoryLookup[]>([]);
  const [categories, setCategories] = useState<InventoryLookup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError("");
    try {
      const [typeRows, categoryRows] = await Promise.all([
        apiRequest<InventoryLookup[]>("/admin/master-data?type=inventory_type"),
        apiRequest<InventoryLookup[]>("/admin/master-data?type=inventory_category"),
      ]);
      setTypes(typeRows.filter((row) => row.is_active));
      setCategories(categoryRows.filter((row) => row.is_active));
    } catch (reason) {
      setOptionsError(messageFor(reason, "Could not load active inventory options."));
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError("");
    try {
      setItems(await apiRequest<InventoryItem[]>("/admin/inventory"));
    } catch (reason) {
      setItemsError(messageFor(reason, "Could not load your location's inventory."));
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadOptions();
      void loadItems();
    });
  }, [loadItems, loadOptions]);

  async function createItem(payload: InventoryPayload) {
    setSaving(true);
    setNotice("");
    try {
      const created = await apiRequest<InventoryItem>("/admin/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotice(`Inventory item ${created.name} created at server-assigned location #${created.location_id}.`);
      await loadItems();
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleShell role="admin">
      <div className="page-heading">
        <p className="eyebrow">STOCK CONTROL</p>
        <h1>Inventory</h1>
        <p>View and add inventory assigned to your location.</p>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {loadingOptions ? <ScreenState kind="loading" message="Loading active inventory options…" /> : optionsError ? (
        <ScreenState kind="error" message={optionsError} onRetry={() => void loadOptions()} />
      ) : (
        <InventoryForm
          categories={categories}
          locationControl={{ mode: "assigned", assignedLocationName: "Assigned by your admin account" }}
          onSubmit={createItem}
          saving={saving}
          types={types}
        />
      )}
      <InventoryList
        admins={[]}
        categories={categories}
        error={itemsError}
        items={items}
        loading={loadingItems}
        locations={[]}
        mode="assigned"
        onEdit={() => undefined}
        onLocationChange={() => undefined}
        onRetry={() => void loadItems()}
        selectedLocation=""
        types={types}
      />
    </RoleShell>
  );
}

function messageFor(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback;
}