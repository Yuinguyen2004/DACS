import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  quiz_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['mcq', 'true_false'])
  type: string;

  @IsOptional()
  @IsString()
  image?: string;
}
