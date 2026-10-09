"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";

export interface PartnerFormPayload {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  skill_id?: number;
  category_id?: number;
}

interface LookupOption {
  id: number;
  text: string;
}

interface PartnerFormProps {
  kind: "vendor" | "engineer";
  skills?: LookupOption[];
  categories?: LookupOption[];
  vendorName?: string;
  saving: boolean;
  onSubmit: (payload: PartnerFormPayload) => Promise<void>;
}

const emptyFields = {
  name: "",
  phone_number: "",
  email: "",
  address: "",
  skill_id: "",
  category_id: "",
};

export function PartnerForm({ kind, skills = [], categories = [], vendorName, saving, onSubmit }: PartnerFormProps) {
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const isVendor = kind === "vendor";

  function updateField(field: keyof typeof emptyFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    const payload: PartnerFormPayload = {
      name: fields.name.trim(),
      phone_number: fields.phone_number.trim(),
    };
    if (isVendor) {
      if (fields.email.trim()) payload.email = fields.email.trim();
      if (fields.address.trim()) payload.address = fields.address.trim();
    } else {
      if (fields.skill_id) payload.skill_id = Number(fields.skill_id);
      if (fields.category_id) payload.category_id = Number(fields.category_id);
    }

    try {
      await onSubmit(payload);
      setFields(emptyFields);
    } catch (reason) {
      if (reason instanceof ApiError) {
        const parsed = splitPartnerErrors(reason.message);
        setErrors(parsed.fields);
        setFormError(parsed.general);
      } else {
        setFormError(`Could not create this ${kind}. Please try again.`);
      }
    }
  }

  return (
    <form className="m14-form admin-partner-form" onSubmit={submit}>
      <div className="form-section-title">
        <div><p className="eyebrow">NEW {isVendor ? "VENDOR" : "ENGINEER"}</p><h2>{isVendor ? "Create vendor" : vendorName ? `Add engineer under ${vendorName}` : "Create service engineer"}</h2></div>
      </div>
      <div className="form-grid">
        <Field label="Name" field="name" value={fields.name} onChange={updateField} error={errors.name} required />
        <Field label="Phone number" field="phone_number" value={fields.phone_number} onChange={updateField} error={errors.phone_number} required />
        {isVendor ? (
          <>
            <Field label="Email" field="email" type="email" value={fields.email} onChange={updateField} error={errors.email} />
            <label className="field-label field-wide" htmlFor="partner-address">Address<textarea id="partner-address" onChange={(event) => updateField("address", event.target.value)} value={fields.address} />{errors.address && <span className="field-error">{errors.address}</span>}</label>
          </>
        ) : (
          <>
            <LookupSelect label="Skill" field="skill_id" rows={skills} value={fields.skill_id} onChange={updateField} error={errors.skill_id} />
            <LookupSelect label="Category" field="category_id" rows={categories} value={fields.category_id} onChange={updateField} error={errors.category_id} />
          </>
        )}
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <button className="primary-button" disabled={saving} type="submit">{saving ? "Creating…" : isVendor ? "Create vendor" : "Create engineer"}</button>
    </form>
  );
}

function Field({
  label,
  field,
  value,
  onChange,
  error,
  required = false,
  type = "text",
}: {
  label: string;
  field: keyof typeof emptyFields;
  value: string;
  onChange: (field: keyof typeof emptyFields, value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  const id = `partner-${field}`;
  return <label className="field-label" htmlFor={id}>{label}<input aria-invalid={Boolean(error)} id={id} onChange={(event) => onChange(field, event.target.value)} required={required} type={type} value={value} />{error && <span className="field-error">{error}</span>}</label>;
}

function LookupSelect({
  label,
  field,
  rows,
  value,
  onChange,
  error,
}: {
  label: string;
  field: "skill_id" | "category_id";
  rows: LookupOption[];
  value: string;
  onChange: (field: keyof typeof emptyFields, value: string) => void;
  error?: string;
}) {
  const id = `partner-${field}`;
  return (
    <label className="field-label" htmlFor={id}>{label}<select aria-invalid={Boolean(error)} id={id} onChange={(event) => onChange(field, event.target.value)} value={value}><option value="">Not specified</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.text}</option>)}</select>{rows.length === 0 && <span className="field-help">No active {label.toLowerCase()} options configured.</span>}{error && <span className="field-error">{error}</span>}</label>
  );
}

function splitPartnerErrors(message: string): { fields: Record<string, string>; general: string } {
  const lower = message.toLowerCase();
  const fields: Record<string, string> = {};
  for (const field of ["name", "phone_number", "email", "address", "skill_id", "category_id"]) {
    if (lower.includes(field)) fields[field] = message;
  }
  return Object.keys(fields).length ? { fields, general: "" } : { fields, general: message };
}