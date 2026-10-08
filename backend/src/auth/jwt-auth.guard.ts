import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.js';
import { Role } from './roles.enum.js';

/**
 * Validates the Bearer JWT and attaches { userId, role } to request.user.
 * Reusable across the app: any controller can apply @UseGuards(JwtAuthGuard).
 * Never logs the token or the secret. JWT_SECRET is read from the environment
 * (loaded via dotenv in main.ts); never hardcoded.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        role: Role;
      }>(token, { secret: process.env.JWT_SECRET });
      const user: AuthenticatedUser = { userId: payload.sub, role: payload.role };
      (request as Request & { user?: AuthenticatedUser }).user = user;
      return true;
    } catch {
      // Covers malformed, tampered and expired tokens alike.
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
