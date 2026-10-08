import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from '../admins/admins.entity.js';
import { Location } from '../locations/locations.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';

/**
 * docs/development-docs.md §1.7 inventory_items
 * Stock items. location_id is NOT NULL: auto-set to the creating admin's
 * location_id when created by an admin; explicitly selected by a super
 * admin. Exactly one of created_by_admin_id / created_by_super_admin_id
 * is expected to be set (enforced at the app layer, not via a DB CHECK).
 */
@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  /** opaque master_data row where type = "inventory_type" */
  @ManyToOne(() => MasterData, { nullable: true })
  @JoinColumn({ name: 'type_id' })
  type: MasterData | null;

  /** opaque master_data row where type = "inventory_category" */
  @ManyToOne(() => MasterData, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: MasterData | null;

  @Column({ type: 'integer', default: 0 })
  units: number;

  /** DECIMAL(10,2), NOT NULL */
  @Column({ name: 'price_per_unit', type: 'decimal', precision: 10, scale: 2 })
  pricePerUnit: string;

  @Column({ name: 'tax_applicable', type: 'boolean', default: false })
  taxApplicable: boolean;

  /** DECIMAL(5,2), only relevant if tax_applicable = true */
  @Column({ name: 'tax_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxPercentage: string | null;

  /** NOT NULL FK -> locations.id (admin's location or super-admin-selected) */
  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  /** FK -> admins.id, nullable (set when an admin created the item) */
  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'created_by_admin_id' })
  createdByAdmin: Admin | null;

  /** FK -> super_admins.id, nullable (set when a super admin created the item) */
  @ManyToOne(() => SuperAdmin, { nullable: true })
  @JoinColumn({ name: 'created_by_super_admin_id' })
  createdBySuperAdmin: SuperAdmin | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
