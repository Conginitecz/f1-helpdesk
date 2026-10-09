import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RequestStatusChangeDto {
  @IsString()
  @IsNotEmpty({ message: 'action is required' })
  @IsIn(['activate', 'deactivate'], { message: 'action must be activate or deactivate' })
  action: 'activate' | 'deactivate';
}
