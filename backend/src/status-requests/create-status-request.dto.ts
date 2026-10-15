import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusRequestType } from './request-types.js';

export class CreateStatusRequestDto {
  @IsEnum(StatusRequestType)
  request_type: StatusRequestType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string | null;
}
