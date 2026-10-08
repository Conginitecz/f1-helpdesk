import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * PATCH /super-admin/locations/:id request body. Every field is optional;
 * only the fields present in the body are changed.
 */
export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'name must not be empty' })
  name?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}
