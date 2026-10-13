"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SelectField, TextareaField, TextField } from "@/components/ui/field";

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
        <TextField label="Name" name="partner-name" value={fields.name} onChange={(event) => updateField("name", event.target.value)} error={errors.name} required />
        <TextField label="Phone number" name="partner-phone_number" value={fields.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} error={errors.phone_number} required />
        {isVendor ? (
          <>
            <TextField label="Email" name="partner-email" type="email" value={fields.email} onChange={(event) => updateField("email", event.target.value)} error={errors.email} />
            <TextareaField className="field-wide" label="Address" name="partner-address" onChange={(event) => updateField("address", event.target.value)} value={fields.address} error={errors.address} />
          </>
        ) : (
          <>
            <LookupSelect label="Skill" field="skill_id" rows={skills} value={fields.skill_id} onChange={updateField} error={errors.skill_id} />
            <LookupSelect label="Category" field="category_id" rows={categories} value={fields.category_id} onChange={updateField} error={errors.category_id} />
          </>
        )}
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <Button disabled={saving} type="submit">{saving ? "Creating…" : isVendor ? "Create vendor" : "Create engineer"}</Button>
    </form>
  );
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
    <SelectField label={label} name={id} onChange={(event) => onChange(field, event.target.value)} value={value} error={error} hint={rows.length === 0 ? `No active ${label.toLowerCase()} options configured.` : undefined}><option value="">Not specified</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.text}</option>)}</SelectField>
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