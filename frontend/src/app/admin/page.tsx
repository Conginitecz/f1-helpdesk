import Link from "next/link";
import { RoleShell } from "@/components/role-shell";

export default function AdminArea() {
  return (
    <RoleShell role="admin">
      <div className="page-heading">
        <p className="eyebrow">ADMIN</p>
        <h1>Workspace</h1>
        <p>Manage your vendors, engineers and assigned-location stock.</p>
      </div>
      <nav className="admin-home-links" aria-label="Admin workspace">
        <Link href="/admin/vendors"><span>01</span><strong>Vendors</strong><small>View and onboard vendors</small></Link>
        <Link href="/admin/engineers"><span>02</span><strong>Service engineers</strong><small>Manage direct and vendor-owned engineers</small></Link>
        <Link href="/admin/inventory"><span>03</span><strong>Inventory</strong><small>View and add stock at your location</small></Link>
      </nav>
    </RoleShell>
  );
}
