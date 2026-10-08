import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Admin } from '../admins/admins.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { Role } from './roles.enum.js';

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
}
