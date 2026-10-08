import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum.js';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to one or more roles, e.g. @Roles(Role.SUPER_ADMIN).
 * Enforced by RolesGuard. Milestones 6–11 rely on this.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
