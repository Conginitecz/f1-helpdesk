"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
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
        {editing && onCancelEdit && <button className="text-button" onClick={onCancelEdit} type="button">Cancel edit</button>}
      </div>
      <div className="form-grid">
        <Field label="Item name" name="inventory-name" error={fieldErrors.name} required value={fields.name} onChange={(value) => setField("name", value)} />
        <label className="field-label" htmlFor="inventory-type">Type<select id="inventory-type" onChange={(event) => setField("type_id", event.target.value)} value={fields.type_id}><option value="">Not specified</option>{types.map((row) => <option key={row.id} value={row.id}>{row.text}</option>)}</select>{types.length === 0 && <span className="field-help">No active inventory types configured.</span>}{fieldErrors.type_id && <span className="field-error">{fieldErrors.type_id}</span>}</label>
        <label className="field-label" htmlFor="inventory-category">Category<select id="inventory-category" onChange={(event) => setField("category_id", event.target.value)} value={fields.category_id}><option value="">Not specified</option>{categories.map((row) => <option key={row.id} value={row.id}>{row.text}</option>)}</select>{categories.length === 0 && <span className="field-help">No active categories configured.</span>}{fieldErrors.category_id && <span className="field-error">{fieldErrors.category_id}</span>}</label>
        <Field label="Units" name="inventory-units" min="0" required type="number" value={fields.units} onChange={(value) => setField("units", value)} error={fieldErrors.units} />
        <Field label="Price per unit" name="inventory-price" min="0" step="0.01" required type="number" value={fields.price_per_unit} onChange={(value) => setField("price_per_unit", value)} error={fieldErrors.price_per_unit} />
        <label className="field-label inventory-toggle" htmlFor="inventory-tax"><span>Tax applicable</span><input checked={fields.tax_applicable} id="inventory-tax" onChange={(event) => setField("tax_applicable", event.target.checked)} type="checkbox" /></label>
        {fields.tax_applicable && <Field label="Tax percentage" name="inventory-tax-percentage" min="0" step="0.01" type="number" value={fields.tax_percentage} onChange={(value) => setField("tax_percentage", value)} error={fieldErrors.tax_percentage} />}
        {locationControl.mode === "select" ? (
          <label className="field-label field-wide" htmlFor="inventory-location">Location<select id="inventory-location" onChange={(event) => setField("location_id", event.target.value)} required value={fields.location_id}><option value="">Choose a location</option>{locationControl.locations?.filter((location) => location.is_active).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>{fieldErrors.location_id && <span className="field-error">{fieldErrors.location_id}</span>}</label>
        ) : (
          <div className="field-label field-wide"><span>Assigned location</span><div className="assigned-location">{locationControl.assignedLocationName ?? `Location #${locationControl.assignedLocationId ?? "—"}`}</div></div>
        )}
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : editing ? "Save changes" : "Create item"}</button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  min,
  step,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  step?: string;
  error?: string;
}) {
  return <label className="field-label" htmlFor={name}>{label}<input id={name} min={min} onChange={(event) => onChange(event.target.value)} required={required} step={step} type={type} value={value} />{error && <span className="field-error">{error}</span>}</label>;
}

function splitFieldErrors(message: string): { fields: Record<string, string>; general: string } {
  const lower = message.toLowerCase();
  const fields: Record<string, string> = {};
  const names = ["name", "type_id", "category_id", "units", "price_per_unit", "tax_applicable", "tax_percentage", "location_id"];
  for (const name of names) {
    if (lower.includes(name)) fields[name] = message;
  }
  return Object.keys(fields).length ? { fields, general: "" } : { fields, general: message };
}
