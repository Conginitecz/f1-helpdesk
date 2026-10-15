import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'phone_number is required' })
  phone_number: string;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'skill_id must be an integer' })
  skill_id?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'category_id must be an integer' })
  category_id?: number | null;
}
