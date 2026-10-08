import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, LoginResult } from './auth.service.js';
import { LoginDto } from './login.dto.js';

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
}
