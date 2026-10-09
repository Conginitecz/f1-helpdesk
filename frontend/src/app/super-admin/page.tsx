import { RoleShell } from "@/components/role-shell";

export default function SuperAdminArea() {
  return (
    <RoleShell role="super_admin">
      <div className="page-heading">
        <p className="eyebrow">SUPER ADMIN</p>
        <h1>Workspace</h1>
        <p>Administration and operations tools will appear here.</p>
      </div>
      <div className="empty-workspace">
        <span className="empty-mark" aria-hidden="true">S</span>
        <div>
          <h2>Workspace ready</h2>
          <p>Your account is signed in. Super-admin tools are coming soon.</p>
        </div>
      </div>
    </RoleShell>
  );
}
