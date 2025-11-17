import { IsString, IsNotEmpty } from 'class-validator';

export class ResumeAttemptDto {
  @IsString()
  @IsNotEmpty()
  resume_token: string;
}
