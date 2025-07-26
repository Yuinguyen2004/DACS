import { IsArray, IsString, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerSubmissionDto {
  @IsString()
  @IsMongoId()
  question_id: string;

  @IsString()
  @IsMongoId()
  selected_answer_id: string;
}

export class SubmitTestDto {
  @IsString()
  @IsMongoId()
  quiz_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSubmissionDto)
  answers: AnswerSubmissionDto[];

  @IsString()
  started_at: string; // ISO date string

  @IsString()
  completed_at: string; // ISO date string
}
