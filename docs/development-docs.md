# F1 Help Desk — Admin & Super Admin Dashboard
## Developer Reference Documentation (V0 scope)

Stack: Next.js (frontend) + NestJS (backend) + PostgreSQL (database,
hosted on Neon) — ORM: TypeORM (@nestjs/typeorm, typeorm, pg; integer
identity PKs)
Scope: Admin & Super Admin web dashboard only. Does NOT cover the Customer
or Service Engineer mobile apps, request-matching engine, payments, or
the state-machine workflows from the main Product Checkpoint document.
Primary keys: integer identity columns (SERIAL / IDENTITY), not UUIDs.

Confirmed exclusions for this slice: no admin-facing view of their own
submitted status-change request outcomes (fire-and-forget for V0); no
password reset / forgot-password flow for V0.

---

## 1. Entities & Database Schema

### 1.1 super_admins

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| email | VARCHAR, UNIQUE, NOT NULL | login identifier |
| username | VARCHAR, UNIQUE, NOT NULL | |
| password_hash | VARCHAR, NOT NULL | store hashed, never plaintext |
| first_name | VARCHAR, NOT NULL | |
| last_name | VARCHAR, NOT NULL | |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| is_deleted | BOOLEAN, NOT NULL, DEFAULT false | soft delete |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

Note: product rules state a single super admin exists, but do not
hard-code a DB constraint for "only one row" — enforce it at the
application/business-logic layer so it stays configurable later.

### 1.2 admins

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| email | VARCHAR, UNIQUE, NOT NULL | |
| username | VARCHAR, UNIQUE, NOT NULL | |
| password_hash | VARCHAR, NOT NULL | |
| first_name | VARCHAR, NOT NULL | |
| last_name | VARCHAR, NOT NULL | |
| phone_number | VARCHAR, NOT NULL | |
| location_id | INTEGER, FK -> locations.id, NOT NULL | admin's home/default location |
| address | VARCHAR/TEXT, NOT NULL | |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| is_deleted | BOOLEAN, NOT NULL, DEFAULT false | soft delete |
| created_by_super_admin_id | INTEGER, FK -> super_admins.id | who created this admin |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

### 1.3 locations

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| name | VARCHAR, NOT NULL | e.g. "Chennai - Velachery" |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

Managed under the Configuration screen (super admin only).

### 1.4 master_data

Generic lookup table for all super-admin-configurable category/type
lists (replaces separate tables for inventory categories, service
engineer skills, partner types, reference types, etc.). One master
"type" groups many rows.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| type | VARCHAR, NOT NULL | e.g. "inventory_category", "service_engineer_skill", "partner_type", "reference_type" |
| text | VARCHAR, NOT NULL | the actual value/label for that row |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

Example: type = "inventory_category", rows with text = "RAM", "SSD",
"Battery", etc. Managed entirely by super admin via Configuration screen.
All partner, skill, category, and status-style fields reference rows in
this table via FK instead of storing free text.

Seeding requirement: types that the application logic itself depends on
(e.g. "partner_type" needing a vendor code and an engineer code,
"reference_type" needing an admin code and a vendor code) must be
seeded with 2-3 default rows at setup time, not left empty — the app
cannot function correctly if these are missing. Super admin can edit
these labels or add further rows later via Configuration, but the
underlying seeded rows/ids that the code logic checks against should
not be deletable from the UI in V0.

### 1.5 partners

Merged table for both vendors and service engineers, distinguished by
partner_type_id (an opaque reference into master_data, not a readable
string — see master_data note below). Keeps vendor-only fields nullable
since they don't apply to engineer rows.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| partner_type_id | INTEGER, FK -> master_data.id, NOT NULL | type = "partner_type" — distinguishes vendor vs. service engineer rows via an opaque code, not a plain string |
| name | VARCHAR, NOT NULL | |
| phone_number | VARCHAR, NOT NULL | |
| email | VARCHAR, NULLABLE | vendor rows typically populate this |
| address | VARCHAR/TEXT, NULLABLE | vendor rows typically populate this |
| skill_id | INTEGER, FK -> master_data.id, NULLABLE | type = "service_engineer_skill" — engineer rows only |
| category_id | INTEGER, FK -> master_data.id, NULLABLE | type = "service_engineer_category" — engineer rows only, kept separate from skill |
| reference_type_id | INTEGER, FK -> master_data.id, NULLABLE | type = "reference_type" — opaque code for "onboarded by admin" vs. "onboarded by vendor"; NULL for vendor rows themselves |
| reference_id | INTEGER, NULLABLE | id into admins.id or partners.id (self-referencing, for engineers under a vendor), depending on reference_type_id. NULL for vendor rows. |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| is_deleted | BOOLEAN, NOT NULL, DEFAULT false | |
| created_by_admin_id | INTEGER, FK -> admins.id, NOT NULL | admin who ultimately onboarded this row (vendor, or engineer added directly) |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

Notes:
- A vendor row: partner_type_id = "vendor" code; reference_type_id and
  reference_id are NULL; created_by_admin_id is the onboarding admin.
- A service engineer row added directly by an admin: partner_type_id =
  "engineer" code; reference_type_id = "admin" code; reference_id =
  that admin's id.
- A service engineer row added under a vendor: partner_type_id =
  "engineer" code; reference_type_id = "vendor" code; reference_id =
  the parent partners.id (the vendor row). Traceability to the owning
  admin: follow reference_id -> that partner row's created_by_admin_id.
- No FK constraint possible directly on reference_id since it can point
  to either admins or partners depending on reference_type_id — enforce
  validity at the application layer.

### 1.7 inventory_items

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| name | VARCHAR, NOT NULL | e.g. "4GB DDR4 RAM" |
| type_id | INTEGER, FK -> master_data.id, NULLABLE | type = "inventory_type" |
| category_id | INTEGER, FK -> master_data.id, NULLABLE | type = "inventory_category" |
| units | INTEGER, NOT NULL, DEFAULT 0 | quantity on hand |
| price_per_unit | DECIMAL(10,2), NOT NULL | |
| tax_applicable | BOOLEAN, NOT NULL, DEFAULT false | |
| tax_percentage | DECIMAL(5,2), NULLABLE | only relevant if tax_applicable = true |
| location_id | INTEGER, FK -> locations.id, NOT NULL | auto-set to the creating admin's location_id when created by an admin; explicitly selected when created by super admin |
| created_by_admin_id | INTEGER, FK -> admins.id, NULLABLE | |
| created_by_super_admin_id | INTEGER, FK -> super_admins.id, NULLABLE | |
| is_active | BOOLEAN, NOT NULL, DEFAULT true | |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

### 1.8 configurations

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| config_key | VARCHAR, UNIQUE, NOT NULL | e.g. "min_service_charge" |
| config_value | VARCHAR, NOT NULL | store as string, cast at use |
| description | VARCHAR | |
| updated_by_super_admin_id | INTEGER, FK -> super_admins.id | |
| updated_at | TIMESTAMP, NOT NULL, DEFAULT now() | |

Holds pricing and any other key/value configurable settings. Locations
and master_data are separate tables (1.3, 1.4) but all managed from the
same Configuration screen.

### 1.9 status_change_requests

Handles the activate/deactivate request-approval flow between admin and
super admin (for service engineers, and any other entity this applies to
later).

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | identity column |
| entity_type | VARCHAR, NOT NULL | e.g. "partner" (covers both vendor and service engineer rows) |
| entity_id | INTEGER, NOT NULL | id of the target row |
| requested_action | VARCHAR, NOT NULL | "activate" or "deactivate" |
| requested_by_admin_id | INTEGER, FK -> admins.id, NOT NULL | |
| status | VARCHAR, NOT NULL, DEFAULT 'pending' | pending / approved / rejected |
| resolved_by_super_admin_id | INTEGER, FK -> super_admins.id, NULLABLE | |
| created_at | TIMESTAMP, NOT NULL, DEFAULT now() | |
| resolved_at | TIMESTAMP, NULLABLE | |

Note: Super admin can also activate/deactivate directly, bypassing this
table entirely (writes straight to is_active on the target entity).
Confirmed: the requesting admin does NOT get a status view of their own
requests in V0 — this table is written to and resolved by super admin
only; no admin-facing read endpoint for it in this slice.

---

## 2. Roles & Permissions Summary

Super Admin:
- Full user management: view/activate/deactivate admins & partners (vendors + service engineers) directly (no approval needed)
- View and resolve (approve/reject) admin-submitted status change requests
- Full configuration access: pricing, locations, master_data (partner types, reference types, categories, skills)
- Create new admin accounts (assigns location at creation)
- Inventory: full view and edit, across all locations

Admin:
- Create partner rows of type "service engineer" (cannot delete or deactivate directly)
- Create partner rows of type "vendor"
- View list of their own partners (vendors and service engineers), filtered to rows they created or that trace back to them
- Submit status-change requests (activate/deactivate) for their service engineers, routed to super admin — fire-and-forget, no status visibility
- Inventory: add-only, auto-tagged to their own location; can view their location's inventory

No login/password-reset self-service in V0 — out of scope.

---

## 3. API Endpoints

Auth
- POST /auth/login — shared login endpoint, returns role + token (admin or super_admin)
- POST /auth/logout
(No forgot-password/reset endpoints in V0.)

Super Admin — User Management
- GET /super-admin/admins — list all admins
- POST /super-admin/admins — create a new admin (includes location_id)
- PATCH /super-admin/admins/:id/activate
- PATCH /super-admin/admins/:id/deactivate
- GET /super-admin/partners?type=vendor|engineer — list all partners, filterable by partner_type_id (resolved from master_data code)
- PATCH /super-admin/partners/:id/activate
- PATCH /super-admin/partners/:id/deactivate
- GET /super-admin/status-requests — list pending (and resolved) status change requests
- PATCH /super-admin/status-requests/:id/approve
- PATCH /super-admin/status-requests/:id/reject

Super Admin — Configuration
- GET /super-admin/config — list all config key/value pairs
- POST /super-admin/config — create a config key/value pair (body: { key, value }); key is trimmed and must contain only lowercase letters, digits, and underscores; value must be a non-empty string; duplicate keys return 409; updated_by_super_admin_id comes from the authenticated super admin
- PATCH /super-admin/config/:key — update a config value
- GET /super-admin/locations — list locations
- POST /super-admin/locations — create location
- PATCH /super-admin/locations/:id — edit location
- GET /super-admin/master-data?type=... — list master data rows, optionally filtered by type (e.g. "partner_type", "reference_type", "inventory_category", "service_engineer_skill")
- POST /super-admin/master-data — create a new row (type + text) — blocked for the core seeded rows that app logic depends on
- PATCH /super-admin/master-data/:id — edit a row's label

Super Admin — Inventory
- GET /super-admin/inventory — view all inventory (optionally filter by location_id)
- POST /super-admin/inventory — create item (location_id required in payload)
- PATCH /super-admin/inventory/:id — edit item

Admin — Partners (Service Engineers)
- GET /admin/partners?type=engineer — list own service engineers (partners created directly by this admin, partner_type_id = engineer code)
- POST /admin/partners — create a service engineer row (partner_type_id = engineer code, reference_type_id = "admin" code, reference_id = own admin id)
- POST /admin/partners/:id/request-status-change — body: { action: "activate"|"deactivate" }

Admin — Partners (Vendors)
- GET /admin/partners?type=vendor — list own vendors (partner_type_id = vendor code, created_by_admin_id = own admin id)
- POST /admin/partners — create a vendor row (partner_type_id = vendor code, reference_type_id and reference_id null)

Admin — Vendor's Service Engineers
- POST /admin/partners/:vendorPartnerId/service-engineers — create a service engineer row under a vendor (partner_type_id = engineer code, reference_type_id = "vendor" code, reference_id = the vendor's partner id)

Admin — Inventory
- GET /admin/inventory — view own location's inventory
- POST /admin/inventory — create item (location_id auto-set from admin's own location_id)

Admin — Master Data (read-only access, for populating dropdowns)
- GET /admin/master-data?type=... — list active master data rows by type (e.g. to populate skill/category dropdowns on creation forms)

---

## 4. Frontend Screens & Flows

### Super Admin

1. Dashboard
   - Entry screen after login
   - Add new admin (form: email, username, password, first name, last name, phone number, address, location dropdown)
   - List/overview of existing admins

2. User Management
   - Tabs or filters for Admins / Vendors / Service Engineers (vendor and engineer tabs both read from the same partners table, filtered by partner_type_id)
   - Table view with status (active/inactive)
   - Direct Activate / Deactivate action buttons (immediate, no approval step)
   - Separate section/tab: Pending Status Requests — list of admin-submitted activate/deactivate requests, each with Approve / Reject actions

3. Configuration
   - Pricing: editable key/value list (e.g. min service charge, other config entries)
   - Locations: list + add new location (name)
   - Master Data: manage category/type lists (e.g. "inventory_category", "service_engineer_skill", "partner_type", "reference_type") — select a type, view/add/edit its rows; core seeded rows that app logic depends on (partner_type and reference_type codes) are label-editable only, not deletable

4. Inventory
   - Table view of all inventory items, filterable by location
   - Add item form (name, type dropdown, category dropdown, units, price per unit, tax applicable toggle, tax percentage, location dropdown)
   - Edit existing items

### Admin

1. Service Engineer Creation & List
   - Creation form: name, phone number, skill dropdown, category dropdown (both sourced from master_data) — saved as a partners row with partner_type_id = engineer code
   - List view of own service engineers (read-only beyond status request)
   - Per-row action: "Request Activation/Deactivation" → opens small form/modal, submits to status_change_requests (no outcome visibility afterward)

2. Vendor Creation & List
   - Creation form: name, phone number, email, address — saved as a partners row with partner_type_id = vendor code
   - List view of own vendors
   - Each vendor row can drill in to add service engineers under that vendor (same creation form, reference_type_id = vendor code, reference_id = that vendor's partner id)

3. Inventory
   - Add item form (name, type dropdown, category dropdown, units, price per unit, tax applicable toggle, tax percentage) — location is auto-set, not shown as a selectable field
   - List view of own location's inventory (view only for V0)

---

## 5. Still Open — Confirm During Build

(No open schema questions remaining for this slice — reference design and
skill/category split both confirmed.)

Out of scope for this slice (per BRD): certification expiry logic,
disciplinary suspension workflow, dispute handling, payment/commission
logic, multi-engineer jobs, real-time engineer-inventory matching
notifications, admin-facing status-request outcomes, password reset.
