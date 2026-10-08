import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { Admin } from '../admins/admins.entity.js';

/**
 * Authentication module. JWT_SECRET and JWT_EXPIRES_IN come from the
 * environment (backend/.env); neither is hardcoded. Guards are exported so
 * Milestones 6–11 can reuse them.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin, Admin]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET is not set in the environment (.env)');
        }
        const expiresIn = process.env.JWT_EXPIRES_IN;
        if (!expiresIn) {
          throw new Error('JWT_EXPIRES_IN is not set in the environment (.env)');
        }
        return {
          secret,
          signOptions: { expiresIn: expiresIn as SignOptions['expiresIn'] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
