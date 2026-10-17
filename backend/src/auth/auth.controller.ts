import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService, LoginResult, MeResponse } from './auth.service.js';
import { LoginDto } from './login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthenticatedUser } from './authenticated-user.js';

/**
 * docs/development-docs.md §2 authentication endpoints.
 * Email is the login identifier. Wrong email and wrong password return the
 * SAME generic 401 (see AuthService).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  logout(): { message: string } {
    // V0: stateless acknowledgement; the client discards the token.
    return this.authService.logout();
  }

  /**
   * Returns the authenticated user's full profile.
   * Protected by JwtAuthGuard (requires valid Bearer token).
   * No RolesGuard — both super_admin and admin roles access their own profile.
   * Used by the frontend:
   *   1. Immediately after login to get display name + location.
   *   2. On page refresh to restore session from the stored token.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.authService.getMe(user.userId, user.role);
  }
}
