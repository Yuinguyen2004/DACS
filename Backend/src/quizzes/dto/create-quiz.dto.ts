import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  time_limit?: number;

  @IsOptional()
  @IsBoolean()
  is_premium: boolean;
}
