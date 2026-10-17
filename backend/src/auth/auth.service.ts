import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Admin } from '../admins/admins.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { Role } from './roles.enum.js';

/**
 * Authenticated user profile — returned by GET /auth/me.
 * Provides the display name and, for Admins, the assigned location name
 * that the frontend needs for scoping and display.
 * Super Admins are global (no location assignment), so location_name is null.
 */
export interface MeResponse {
  id: number;
  role: Role;
  /** Concatenated first_name + last_name for display. */
  display_name: string;
  /** Username, unique per user. */
  username: string;
  email: string;
  /**
   * Name of the admin's assigned location.
   * null for super_admin (global access, no location assignment).
   */
  location_id: number | null;
  location_name: string | null;
}

/**
 * A single, generic failure for every authentication problem (unknown email,
 * wrong password, inactive/deleted user). Using the same message and status
 * for all cases means the response never reveals whether an account exists.
 */
const GENERIC_LOGIN_ERROR = new UnauthorizedException(
  'Invalid email or password',
);

export interface LoginResult {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string;
  user: { id: number; role: Role };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminsRepo: Repository<SuperAdmin>,
    @InjectRepository(Admin)
    private readonly adminsRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    // 1) super_admins first
    const superAdmin = await this.superAdminsRepo.findOne({ where: { email } });
    if (superAdmin) {
      this.ensureUsable(superAdmin.isActive, superAdmin.isDeleted);
      await this.verifyPassword(password, superAdmin.passwordHash);
      return this.issueToken(superAdmin.id, Role.SUPER_ADMIN);
    }

    // 2) then admins
    const admin = await this.adminsRepo.findOne({ where: { email } });
    if (admin) {
      this.ensureUsable(admin.isActive, admin.isDeleted);
      await this.verifyPassword(password, admin.passwordHash);
      return this.issueToken(admin.id, Role.ADMIN);
    }

    // No matching account at all — same generic error.
    throw GENERIC_LOGIN_ERROR;
  }

  /**
   * V0 logout is stateless: the client simply discards the token. We return a
   * simple acknowledgement; no server-side session/denylist is kept.
   */
  logout(): { message: string } {
    return { message: 'Logged out' };
  }

  /** Rejects inactive or soft-deleted accounts with the generic error. */
  private ensureUsable(isActive: boolean, isDeleted: boolean): void {
    if (!isActive || isDeleted) {
      throw GENERIC_LOGIN_ERROR;
    }
  }

  /**
   * bcryptjs compare — the same library used when seeding. On mismatch (or any
   * compare error) throws the generic error; never reveals the reason.
   */
  private async verifyPassword(
    plain: string,
    hash: string,
  ): Promise<void> {
    let ok = false;
    try {
      ok = await bcrypt.compare(plain, hash);
    } catch (error) {
      this.logger.error('Password comparison failed unexpectedly');
      throw GENERIC_LOGIN_ERROR;
    }
    if (!ok) {
      throw GENERIC_LOGIN_ERROR;
    }
  }

  /** Issues the JWT (payload: sub + role only) and builds the response body. */
  private issueToken(id: number, role: Role): LoginResult {
    const expiresIn = process.env.JWT_EXPIRES_IN;
    if (!expiresIn) {
      throw new Error('JWT_EXPIRES_IN is not set in the environment (.env)');
    }
    const accessToken = this.jwtService.sign(
      { sub: id, role },
      { expiresIn: expiresIn as SignOptions['expiresIn'] },
    );
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: { id, role },
    };
  }

  /**
   * Returns the full profile for the currently authenticated user.
   * Called by GET /auth/me (protected by JwtAuthGuard).
   * Used by the frontend immediately after login and on page refresh to
   * restore the display name and, for Admins, the assigned location.
   */
  async getMe(userId: number, role: Role): Promise<MeResponse> {
    if (role === Role.SUPER_ADMIN) {
      const superAdmin = await this.superAdminsRepo.findOne({
        select: { id: true, email: true, username: true, firstName: true, lastName: true },
        where: { id: userId },
      });
      if (!superAdmin) {
        throw new NotFoundException('Authenticated super admin not found');
      }
      return {
        id: superAdmin.id,
        role,
        display_name: `${superAdmin.firstName} ${superAdmin.lastName}`.trim(),
        username: superAdmin.username,
        email: superAdmin.email,
        location_id: null,
        location_name: null,
      };
    }

    // Role.ADMIN — load with location relation to get the location name.
    const admin = await this.adminsRepo.findOne({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        location: { id: true, name: true },
      },
      relations: { location: true },
      where: { id: userId },
    });
    if (!admin) {
      throw new NotFoundException('Authenticated admin not found');
    }
    return {
      id: admin.id,
      role,
      display_name: `${admin.firstName} ${admin.lastName}`.trim(),
      username: admin.username,
      email: admin.email,
      location_id: admin.location?.id ?? null,
      location_name: admin.location?.name ?? null,
    };
  }
}
