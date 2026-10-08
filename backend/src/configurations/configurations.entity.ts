import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';

/**
 * docs/development-docs.md §1.8 configurations
 * Key/value settings (pricing etc.). config_value is stored as a string
 * and cast at the point of use. config_key is UNIQUE.
 */
@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;

  /** UNIQUE, NOT NULL — e.g. "min_service_charge" */
  @Column({ name: 'config_key', type: 'varchar', unique: true })
  configKey: string;

  /** NOT NULL — store as string, cast at use */
  @Column({ name: 'config_value', type: 'varchar' })
  configValue: string;

  /** human-readable description (docs: VARCHAR, no NOT NULL) */
  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  /** FK -> super_admins.id (docs: no NOT NULL) */
  @ManyToOne(() => SuperAdmin, { nullable: true })
  @JoinColumn({ name: 'updated_by_super_admin_id' })
  updatedBySuperAdmin: SuperAdmin | null;

  @RelationId((configuration: Configuration) => configuration.updatedBySuperAdmin)
  updatedBySuperAdminId: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
