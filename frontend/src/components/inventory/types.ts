export interface InventoryItem {
  id: number;
  name: string;
  type_id: number | null;
  category_id: number | null;
  units: number;
  price_per_unit: string;
  tax_applicable: boolean;
  tax_percentage: string | null;
  location_id: number;
  created_by_admin_id: number | null;
  created_by_super_admin_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLookup {
  id: number;
  text: string;
  is_active: boolean;
}

export interface InventoryLocation {
  id: number;
  name: string;
  is_active: boolean;
}

export interface InventoryCreator {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
