import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

/**
 * POST /super-admin/admins request body (docs/development-docs.md §1.2, §3).
 * Keys are snake_case to match the documented payload (`location_id`) and the
 * API's response shape. Unknown keys — including any audit column such as
 * `created_by_super_admin_id` or `is_active` — are rejected by the global
 * ValidationPipe (forbidNonWhitelisted), so the body can never set them.
 */
export class CreateAdminDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'username is required' })
  username: string;

  /** Plain text on input only; hashed with bcryptjs before storing, never returned. */
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'first_name is required' })
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: 'last_name is required' })
  last_name: string;

  @IsString()
  @IsNotEmpty({ message: 'phone_number is required' })
  phone_number: string;

  @IsString()
  @IsNotEmpty({ message: 'address is required' })
  address: string;

  @IsInt({ message: 'location_id must be an integer' })
  @Min(1)
  location_id: number;
}
