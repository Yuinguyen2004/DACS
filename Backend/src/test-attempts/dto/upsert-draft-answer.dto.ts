import { IsString, IsMongoId, IsInt, Min } from 'class-validator';

export class UpsertDraftAnswerDto {
  @IsString()
  @IsMongoId()
  question_id: string;

  @IsString()
  @IsMongoId()
  selected_answer_id: string;

  @IsInt()
  @Min(0)
  client_seq: number;
}
