import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SystemNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  data?: any;
}