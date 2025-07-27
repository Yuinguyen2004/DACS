import { IsArray, IsString, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO cho moi cau tra loi khi nop bai
 * Luu ID cau hoi va ID dap an da chon
 */
export class AnswerSubmissionDto {
  // ID cua cau hoi
  @IsString()
  @IsMongoId()
  question_id: string;

  // ID cua dap an ma nguoi dung da chon
  @IsString()
  @IsMongoId()
  selected_answer_id: string;
}

/**
 * DTO de nop bai test hoan thanh
 * Chua tat ca thong tin can thiet de tinh diem
 */
export class SubmitTestDto {
  // ID cua quiz da lam
  @IsString()
  @IsMongoId()
  quiz_id: string;

  // Mang chua tat ca cau tra loi da chon
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSubmissionDto)
  answers: AnswerSubmissionDto[];

  // Thoi diem bat dau lam bai (dang ISO string)
  @IsString()
  started_at: string; // ISO date string

  // Thoi diem nop bai (dang ISO string)
  @IsString()
  completed_at: string; // ISO date string
}
