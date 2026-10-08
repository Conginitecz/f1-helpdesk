import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const MASTER_DATA_TYPES = [
  'partner_type',
  'reference_type',
  'inventory_type',
  'inventory_category',
  'service_engineer_skill',
  'service_engineer_category',
] as const;

export class CreateMasterDataDto {
  @IsString()
  @IsIn(MASTER_DATA_TYPES)
  type: (typeof MASTER_DATA_TYPES)[number];

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  text: string;
}