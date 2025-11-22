import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @IsIn(['mcq', 'true_false'])
  type?: string;
}
