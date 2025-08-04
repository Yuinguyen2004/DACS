import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class BroadcastNotificationDto {
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
  @IsArray()
  @IsMongoId({
    each: true,
    message: 'Each user ID must be a valid MongoDB ObjectId',
  })
  userIds?: string[]; // Nếu không có thì broadcast cho tất cả users
}
