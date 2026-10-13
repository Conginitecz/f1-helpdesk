"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import type { InventoryItem, InventoryLocation, InventoryLookup } from "./types";

export interface InventoryPayload {
  name: string;
  type_id?: number;
  category_id?: number;
  units: number;
  price_per_unit: string;
  tax_applicable: boolean;
  tax_percentage?: string;
  location_id?: number;
}

interface LocationControl {
  mode: "select" | "assigned";
  locations?: InventoryLocation[];
  assignedLocationName?: string;
  assignedLocationId?: number;
}

interface InventoryFormProps {
  types: InventoryLookup[];
  categories: InventoryLookup[];
  locationControl: LocationControl;
  initialItem?: InventoryItem | null;
  saving: boolean;
  onSubmit: (payload: InventoryPayload) => Promise<void>;
  onCancelEdit?: () => void;
}

interface FormFields {
  name: string;
  type_id: string;
  category_id: string;
  units: string;
  price_per_unit: string;
  tax_applicable: boolean;
  tax_percentage: string;
  location_id: string;
}

const blankFields: FormFields = {
  name: "",
  type_id: "",
  category_id: "",
  units: "0",
  price_per_unit: "",
  tax_applicable: false,
  tax_percentage: "",
  location_id: "",
};

export function InventoryForm({
  types,
  categories,
  locationControl,
  initialItem,
  saving,
  onSubmit,
  onCancelEdit,
}: InventoryFormProps) {
  const [fields, setFields] = useState<FormFields>(blankFields);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const editing = Boolean(initialItem);

  useEffect(() => {
    queueMicrotask(() => {
      setFormError("");
      setFieldErrors({});
      setFields(initialItem ? {
        name: initialItem.name,
        type_id: initialItem.type_id === null ? "" : String(initialItem.type_id),
        category_id: initialItem.category_id === null ? "" : String(initialItem.category_id),
        units: String(initialItem.units),
        price_per_unit: initialItem.price_per_unit,
        tax_applicable: initialItem.tax_applicable,
        tax_percentage: initialItem.tax_percentage ?? "",
        location_id: locationControl.mode === "select" ? String(initialItem.location_id) : "",
      } : { ...blankFields, location_id: locationControl.mode === "select" ? "" : "" });
    });
  }, [initialItem, locationControl.mode]);

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    const payload: InventoryPayload = {
      name: fields.name.trim(),
      units: Number(fields.units || 0),
      price_per_unit: fields.price_per_unit.trim(),
      tax_applicable: fields.tax_applicable,
    };
    if (fields.type_id) payload.type_id = Number(fields.type_id);
    if (fields.category_id) payload.category_id = Number(fields.category_id);
    if (fields.tax_applicable && fields.tax_percentage) payload.tax_percentage = fields.tax_percentage.trim();
    if (locationControl.mode === "select") payload.location_id = Number(fields.location_id);
    await onSubmit(payload).catch((reason: unknown) => {
      if (reason instanceof ApiError) {
        const errors = splitFieldErrors(reason.message);
        setFieldErrors(errors.fields);
        setFormError(errors.general);
      } else {
        setFormError("Could not save this item. Please try again.");
      }
    });
  }

  return (
    <form className="inventory-form m14-form" onSubmit={submit}>
      <div className="form-section-title">
        <div><p className="eyebrow">{editing ? "UPDATE STOCK" : "NEW STOCK"}</p><h2>{editing ? `Edit ${initialItem?.name ?? "item"}` : "Add inventory item"}</h2></div>
        {editing && onCancelEdit && <Button variant="ghost" size="compact" onClick={onCancelEdit} type="button">Cancel edit</Button>}
      </div>
      <div className="form-grid">
        <TextField label="Item name" name="inventory-name" error={fieldErrors.name} required value={fields.name} onChange={(event) => setField("name", event.target.value)} />
        <LookupField label="Type" name="inventory-type" value={fields.type_id} onChange={(value) => setField("type_id", value)} rows={types} emptyHint="No active inventory types configured." error={fieldErrors.type_id} />
        <LookupField label="Category" name="inventory-category" value={fields.category_id} onChange={(value) => setField("category_id", value)} rows={categories} emptyHint="No active categories configured." error={fieldErrors.category_id} />
        <TextField label="Units" name="inventory-units" min="0" required type="number" value={fields.units} onChange={(event) => setField("units", event.target.value)} error={fieldErrors.units} />
        <TextField label="Price per unit" name="inventory-price" min="0" step="0.01" required type="number" value={fields.price_per_unit} onChange={(event) => setField("price_per_unit", event.target.value)} error={fieldErrors.price_per_unit} />
        <Checkbox label="Tax applicable" name="inventory-tax" checked={fields.tax_applicable} onChange={(event) => setField("tax_applicable", event.target.checked)} />
        {fields.tax_applicable && <TextField label="Tax percentage" name="inventory-tax-percentage" min="0" step="0.01" type="number" value={fields.tax_percentage} onChange={(event) => setField("tax_percentage", event.target.value)} error={fieldErrors.tax_percentage} />}
        {locationControl.mode === "select" ? (
          <SelectField className="field-wide" label="Location" name="inventory-location" onChange={(event) => setField("location_id", event.target.value)} required value={fields.location_id} error={fieldErrors.location_id}><option value="">Choose a location</option>{locationControl.locations?.filter((location) => location.is_active).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</SelectField>
        ) : (
          <div className="field-label field-wide"><span>Assigned location</span><div className="assigned-location">{locationControl.assignedLocationName ?? `Location #${locationControl.assignedLocationId ?? "—"}`}</div></div>
        )}
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Button disabled={saving} type="submit">{saving ? "Saving…" : editing ? "Save changes" : "Create item"}</Button>
    </form>
  );
}

function LookupField({
  label,
  name,
  value,
  onChange,
  rows,
  emptyHint,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows: InventoryLookup[];
  emptyHint: string;
  error?: string;
}) {
  return <SelectField label={label} name={name} value={value} onChange={(event) => onChange(event.target.value)} error={error} hint={rows.length === 0 ? emptyHint : undefined}><option value="">Not specified</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.text}</option>)}</SelectField>;
}

function splitFieldErrors(message: string): { fields: Record<string, string>; general: string } {
  const lower = message.toLowerCase();
  const fields: Record<string, string> = {};
  const aliases: Record<string, string[]> = {
    name: ["name"],
    type_id: ["type_id", "inventory_type"],
    category_id: ["category_id", "inventory_category"],
    units: ["units"],
    price_per_unit: ["price_per_unit"],
    tax_applicable: ["tax_applicable"],
    tax_percentage: ["tax_percentage"],
    location_id: ["location_id"],
  };
  for (const [field, tokens] of Object.entries(aliases)) {
    if (tokens.some((token) => lower.includes(token))) fields[field] = message;
  }
  return Object.keys(fields).length ? { fields, general: "" } : { fields, general: message };
}
