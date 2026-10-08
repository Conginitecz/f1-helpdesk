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
import { MasterData } from '../master-data/master-data.entity.js';

/**
 * docs/development-docs.md §1.5 partners
 * Merged table for vendors and service engineers, distinguished by
 * partner_type_id (an opaque master_data code, not a readable string).
 * Vendor-only fields stay nullable so engineer rows can leave them empty.
 *
 * reference_id is polymorphic (admins.id OR partners.id depending on
 * reference_type_id) so it has NO DB foreign key — validity is enforced
 * at the application layer per the docs.
 */
@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  /** opaque master_data row where type = "partner_type" — NOT NULL */
  @ManyToOne(() => MasterData, { nullable: false })
  @JoinColumn({ name: 'partner_type_id' })
  partnerType: MasterData;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  phoneNumber: string;

  /** vendor rows typically populate this — nullable */
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  /** docs allow VARCHAR/TEXT — TEXT chosen (matches admins.address); nullable */
  @Column({ type: 'text', nullable: true })
  address: string | null;

  /** opaque master_data row where type = "service_engineer_skill" — engineer rows only */
  @ManyToOne(() => MasterData, { nullable: true })
  @JoinColumn({ name: 'skill_id' })
  skill: MasterData | null;

  /** opaque master_data row where type = "service_engineer_category" — engineer rows only */
  @ManyToOne(() => MasterData, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: MasterData | null;

  /** opaque master_data row where type = "reference_type" (admin vs vendor onboarding) */
  @ManyToOne(() => MasterData, { nullable: true })
  @JoinColumn({ name: 'reference_type_id' })
  referenceType: MasterData | null;

  /**
   * id into admins.id or partners.id (self-referencing) depending on
   * reference_type_id. No FK constraint (polymorphic) — app-layer validation.
   */
  @Column({ name: 'reference_id', type: 'integer', nullable: true })
  referenceId: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  /** admin who ultimately onboarded this row — NOT NULL */
  @ManyToOne(() => Admin, { nullable: false })
  @JoinColumn({ name: 'created_by_admin_id' })
  createdByAdmin: Admin;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
