import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  data?: any;
}
