import { RoleShell } from "@/components/role-shell";

export default function AdminArea() {
  return (
    <RoleShell role="admin">
      <div className="page-heading">
        <p className="eyebrow">ADMIN</p>
        <h1>Workspace</h1>
        <p>Partner and inventory tools will appear here.</p>
      </div>
      <div className="empty-workspace">
        <span className="empty-mark" aria-hidden="true">A</span>
        <div>
          <h2>Workspace ready</h2>
          <p>Your account is signed in. Admin tools are coming soon.</p>
        </div>
      </div>
    </RoleShell>
  );
}
