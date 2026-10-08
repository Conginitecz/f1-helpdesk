import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../admins/admins.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';

/**
 * docs/development-docs.md §1.9 status_change_requests
 * Admin -> super admin activate/deactivate approval flow. entity_id is
 * polymorphic (points at a partner/admin/etc row) so it has NO DB foreign
 * key — validity is enforced at the application layer.
 *
 * V0 scope note: written by admins, resolved (approved/rejected) by super
 * admin only. No admin-facing read endpoint in this slice.
 */
@Entity('status_change_requests')
export class StatusChangeRequest {
  @PrimaryGeneratedColumn()
  id: number;

  /** e.g. "partner" (covers both vendor and service engineer rows) */
  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: string;

  /** id of the target row — polymorphic, no FK constraint */
  @Column({ name: 'entity_id', type: 'integer' })
  entityId: number;

  /** "activate" or "deactivate" */
  @Column({ name: 'requested_action', type: 'varchar' })
  requestedAction: string;

  /** FK -> admins.id, NOT NULL (the admin who submitted the request) */
  @ManyToOne(() => Admin, { nullable: false })
  @JoinColumn({ name: 'requested_by_admin_id' })
  requestedByAdmin: Admin;

  /** pending / approved / rejected — NOT NULL, DEFAULT 'pending' */
  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  /** FK -> super_admins.id, nullable (set when a super admin resolves it) */
  @ManyToOne(() => SuperAdmin, { nullable: true })
  @JoinColumn({ name: 'resolved_by_super_admin_id' })
  resolvedBySuperAdmin: SuperAdmin | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  /** set when the request is resolved; NULL while pending */
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;
}
