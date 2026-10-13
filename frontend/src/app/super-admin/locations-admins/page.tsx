"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RoleShell } from "@/components/role-shell";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { apiRequest, ApiError } from "@/lib/api";

interface LocationRow {
  id: number;
  name: string;
  is_active: boolean;
}

interface AdminRow {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location_id: number | null;
  is_active: boolean;
}

interface AdminForm {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  location_id: string;
}

const emptyAdmin: AdminForm = {
  email: "",
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  address: "",
  location_id: "",
};

export default function LocationsAdminsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [locationName, setLocationName] = useState("");
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [locationError, setLocationError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadLists() {
    setLoading(true);
    setLoadError("");
    try {
      const [locationRows, adminRows] = await Promise.all([
        apiRequest<LocationRow[]>("/super-admin/locations"),
        apiRequest<AdminRow[]>("/super-admin/admins"),
      ]);
      setLocations(locationRows);
      setAdmins(adminRows);
    } catch (reason) {
      setLoadError(messageFor(reason, "Could not load locations and admins."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadLists());
  }, []);

  async function createLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocationError("");
    setNotice("");
    setSavingLocation(true);
    try {
      const created = await apiRequest<LocationRow>("/super-admin/locations", {
        method: "POST",
        body: JSON.stringify({ name: locationName.trim() }),
      });
      setLocationName("");
      setNotice(`Location “${created.name}” created.`);
      await loadLists();
    } catch (reason) {
      setLocationError(messageFor(reason, "Could not create location."));
    } finally {
      setSavingLocation(false);
    }
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminError("");
    setNotice("");
    setSavingAdmin(true);
    try {
      await apiRequest<AdminRow>("/super-admin/admins", {
        method: "POST",
        body: JSON.stringify({ ...adminForm, location_id: Number(adminForm.location_id) }),
      });
      setAdminForm(emptyAdmin);
      setNotice("Admin account created.");
      await loadLists();
    } catch (reason) {
      setAdminError(messageFor(reason, "Could not create admin account."));
    } finally {
      setSavingAdmin(false);
    }
  }

  function updateAdminField(field: keyof AdminForm, value: string) {
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">ACCOUNT SETUP</p>
        <h1>Locations &amp; admins</h1>
        <p>Create service locations and assign each admin to a location.</p>
      </div>
      {notice && <p className="success-message" role="status">{notice}</p>}
      {loadError ? (
        <ScreenState kind="error" message={loadError} onRetry={() => void loadLists()} />
      ) : loading ? (
        <ScreenState kind="loading" message="Loading locations and admins…" />
      ) : (
        <div className="m14-columns">
          <section className="m14-section" aria-labelledby="locations-title">
            <div className="section-heading">
              <div><p className="eyebrow">DIRECTORY</p><h2 id="locations-title">Locations</h2></div>
              <span className="section-count">{locations.length}</span>
            </div>
            {locations.length ? (
              <div className="data-list">
                {locations.map((location) => (
                  <div className="data-row" key={location.id}>
                    <strong>{location.name}</strong>
                    <span className={location.is_active ? "status-pill status-active" : "status-pill status-inactive"}>
                      {location.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            ) : <ScreenState kind="empty" message="No locations yet." />}
            <form className="m14-form compact-form" onSubmit={createLocation}>
              <div className="inline-form-row">
                <TextField
                  id="location-name"
                  label="New location"
                  maxLength={255}
                  onChange={(event) => setLocationName(event.target.value)}
                  required
                  value={locationName}
                />
                <Button disabled={savingLocation} type="submit">{savingLocation ? "Creating…" : "Create"}</Button>
              </div>
              {locationError && <p className="form-error" role="alert">{locationError}</p>}
            </form>
          </section>

          <section className="m14-section" aria-labelledby="admins-title">
            <div className="section-heading">
              <div><p className="eyebrow">ACCESS</p><h2 id="admins-title">Admins</h2></div>
              <span className="section-count">{admins.length}</span>
            </div>
            {admins.length ? (
              <div className="data-list">
                {admins.map((admin) => (
                  <div className="data-row admin-list-row" key={admin.id}>
                    <div><strong>{admin.first_name} {admin.last_name}</strong><span>{admin.email}</span></div>
                    <div className="admin-row-meta">
                      <span>{locations.find((location) => location.id === admin.location_id)?.name ?? "No location"}</span>
                      <span className={admin.is_active ? "status-pill status-active" : "status-pill status-inactive"}>{admin.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <ScreenState kind="empty" message="No admins yet." />}
            <form className="m14-form admin-create-form" onSubmit={createAdmin}>
              <h3>Create admin account</h3>
              <div className="form-grid">
                <TextField label="First name" name="admin-first-name" value={adminForm.first_name} onChange={(event) => updateAdminField("first_name", event.target.value)} required />
                <TextField label="Last name" name="admin-last-name" value={adminForm.last_name} onChange={(event) => updateAdminField("last_name", event.target.value)} required />
                <TextField label="Email" name="admin-email" type="email" value={adminForm.email} onChange={(event) => updateAdminField("email", event.target.value)} required />
                <TextField label="Username" name="admin-username" value={adminForm.username} onChange={(event) => updateAdminField("username", event.target.value)} required />
                <TextField label="Temporary password" name="admin-password" type="password" value={adminForm.password} onChange={(event) => updateAdminField("password", event.target.value)} required />
                <TextField label="Phone number" name="admin-phone" value={adminForm.phone_number} onChange={(event) => updateAdminField("phone_number", event.target.value)} required />
                <TextField className="field-wide" label="Address" name="admin-address" value={adminForm.address} onChange={(event) => updateAdminField("address", event.target.value)} required />
                <SelectField className="field-wide" label="Assigned location" name="admin-location" onChange={(event) => updateAdminField("location_id", event.target.value)} required value={adminForm.location_id}><option value="">Choose a location</option>{locations.filter((location) => location.is_active).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</SelectField>
              </div>
              {adminError && <p className="form-error" role="alert">{adminError}</p>}
              <Button disabled={savingAdmin || locations.filter((location) => location.is_active).length === 0} type="submit">{savingAdmin ? "Creating account…" : "Create admin"}</Button>
            </form>
          </section>
        </div>
      )}
    </RoleShell>
  );
}

function messageFor(reason: unknown, fallback: string): string {
  if (!(reason instanceof ApiError)) return fallback;
  return reason.message;
}
