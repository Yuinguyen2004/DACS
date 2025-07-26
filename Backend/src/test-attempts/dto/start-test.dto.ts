import { IsString, IsMongoId } from 'class-validator';

export class StartTestDto {
  @IsString()
  @IsMongoId()
  quiz_id: string;
}
