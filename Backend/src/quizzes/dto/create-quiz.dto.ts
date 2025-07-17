import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsBoolean()
  is_Premium: boolean;
}
