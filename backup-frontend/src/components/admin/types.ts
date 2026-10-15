export interface AdminPartner {
  id: number;
  partner_type_id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  skill_id: number | null;
  category_id: number | null;
  reference_type_id: number | null;
  reference_id: number | null;
  is_active: boolean;
  lifecycle_status: PartnerLifecycleStatus | null;
  is_deleted: boolean;
  created_by_admin_id: number;
  created_at: string;
}

export interface AdminLookup {
  id: number;
  type: string;
  text: string;
  is_active: boolean;
}

export interface StatusRequest {
  id: number;
  entity_type: string;
  entity_id: number;
  requested_action: "activate" | "deactivate" | "onboard";
  request_type: StatusRequestType | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
}

export type PartnerLifecycleStatus = "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE" | "REJECTED";
export type StatusRequestType =
  | "VENDOR_ONBOARDING"
  | "VENDOR_ACTIVATION"
  | "VENDOR_DEACTIVATION"
  | "ENGINEER_ACTIVATION"
  | "ENGINEER_DEACTIVATION";
