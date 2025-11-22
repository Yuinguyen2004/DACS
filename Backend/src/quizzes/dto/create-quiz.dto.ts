import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Time limit must be at least 1 minute' })
  @Max(480, { message: 'Time limit cannot exceed 480 minutes (8 hours)' })
  time_limit?: number;

  @IsOptional()
  @IsBoolean()
  is_premium: boolean;
}
