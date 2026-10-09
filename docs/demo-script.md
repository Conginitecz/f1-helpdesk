# V0 Demo Script (5-7 minutes)

Use the live app at `http://localhost:3000` with the local backend/Neon environment already configured. Do not use real customer data.

## Accounts

- Super admin: `superadmin@f1helpdesk.dev`; password: `[SEED_SUPER_ADMIN_PASSWORD from the approved local secret store]`.
- Primary admin: create during the demo with email `demo-admin@example.com`; password: `[choose and share through the approved secret channel]`.
- Second admin: create during the demo with email `demo-admin-2@example.com`; password: `[choose and share through the approved secret channel]`.

Never put a real password in this file, source control, chat, or a screen recording.

## Click-Through

1. Sign in as the super admin. Open **Locations & admins** and create a location named `DEMO-Chennai-<date>`. In **Create admin account**, enter the primary admin details, assign that location, and create the account.
2. Log out. Sign in as the primary admin. Open **Vendors**, create `DEMO-Authorized-Parts` with phone, email and address, and point out its type, status and created date.
3. Open **Service engineers**. Leave Owner as **Direct admin** and create a direct engineer. Select the vendor and create a second engineer under it. Point out the readable type and owner labels.
4. Use **Request deactivation** for each engineer and confirm. The rows show **Pending approval** while both engineers remain Active.
5. Open **Inventory**. Create a small item such as `DEMO-Display-Cable`, choose a seeded type, and point out that location is assigned by the server and shown by name in the list.
6. Log out and sign in as the super admin. In **Status requests**, approve the direct engineer's request and reject the vendor-owned engineer's request. In the **Partners** overview, show the readable partner labels, owner admin and location. In **Inventory**, show the admin-created item and its location name.
7. Still as super admin, create a second location and second admin. Log in as the second admin. Show the empty Vendors, Service engineers, and Inventory lists and verify the first admin's data is absent.

Keep the walkthrough focused on the working V0 journey. The test records created in a rehearsal should be added to the purge list and removed only after the purge plan receives explicit approval.

## Do Not Demo or Mention

- No inventory delete action exists.
- Admins cannot edit inventory or vendors; those edit routes are not exposed for the admin role.
- Inventory is shared by assigned location, not partitioned by the admin who created an item. Use distinct locations when demonstrating tenant separation.
- No active service-engineer skill or category examples may be configured in a fresh database; the optional fields can remain unspecified.
- Configuration editors, password reset, and self-signup are outside this V0 dashboard.
- Status request history is read-only for the requesting admin; only the super admin resolves requests.
