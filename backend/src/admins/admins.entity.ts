import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../locations/locations.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';

/**
 * docs/development-docs.md §1.2 admins
 * address: docs allow VARCHAR/TEXT — TEXT chosen.
 */
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  phoneNumber: string;

  /** admin's home/default location — NOT NULL FK -> locations.id */
  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  /** who created this admin — nullable FK -> super_admins.id (docs: no NOT NULL) */
  @ManyToOne(() => SuperAdmin, { nullable: true })
  @JoinColumn({ name: 'created_by_super_admin_id' })
  createdBySuperAdmin: SuperAdmin | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
