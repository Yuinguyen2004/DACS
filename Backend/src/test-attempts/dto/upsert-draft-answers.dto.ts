import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertDraftAnswerDto } from './upsert-draft-answer.dto';

export class UpsertDraftAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertDraftAnswerDto)
  answers: UpsertDraftAnswerDto[];
}
