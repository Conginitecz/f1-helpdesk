import { Role } from './roles.enum.js';

/**
 * The authenticated principal attached to the request by JwtAuthGuard.
 * Contains ONLY the user id and role — nothing sensitive.
 */
export interface AuthenticatedUser {
  userId: number;
  role: Role;
}
