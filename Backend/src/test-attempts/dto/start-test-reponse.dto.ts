export class StartTestResponseDto {
  attempt_id: string;
  quiz: {
    _id: string;
    title: string;
    description: string;
    time_limit: number | null;
  };
  questions: any[];
  total_questions: number;
  started_at: string;
}
