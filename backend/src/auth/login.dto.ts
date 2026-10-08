import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login body. Login identifier is EMAIL only (docs/development-docs.md §1.1
 * marks `email` as the "login identifier"). Validation is intentionally
 * light on the password (non-empty string) so that a wrong/short password
 * reaches the service and returns the SAME generic 401 as an unknown email
 * (we must not reveal which accounts exist).
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
