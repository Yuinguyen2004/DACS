import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId({ message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}