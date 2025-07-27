import { IsString, IsMongoId } from 'class-validator';

/**
 * DTO de bat dau lam bai test
 * Chi can truyen quiz_id de bat dau
 */
export class StartTestDto {
  // ID cua quiz ma nguoi dung muon lam bai
  @IsString()
  @IsMongoId()
  quiz_id: string;
}
