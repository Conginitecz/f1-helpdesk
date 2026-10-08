import { IsNotEmpty, IsString } from 'class-validator';

/**
 * POST /super-admin/locations request body (docs §1.3: `name` is the only
 * documented field; is_active defaults to true server-side).
 */
export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;
}
