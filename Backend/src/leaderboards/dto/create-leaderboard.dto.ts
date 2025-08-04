import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateLeaderboardDto {
  @IsString()
  quizId: string;

  @IsString()
  userId: string;

  @IsString()
  attemptId: string;

  @IsNumber()
  @Min(0, { message: 'Score must be at least 0' })
  score: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Time spent must be at least 0' })
  timeSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Rank must be at least 1' })
  rank?: number;
}
