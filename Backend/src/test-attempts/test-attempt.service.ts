import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestAttempt } from './test-attempt.schema';
import { Quiz } from '../quizzes/quiz.schema';
import { Question } from '../questions/question.schema';
import { Answer } from '../answers/answer.schema';
import { User } from '../users/user.schema';
import { SubmitTestDto } from './dto/submit-test.dto';
import { StartTestResponseDto } from './dto/start-test-reponse.dto';
import { LeaderboardService } from '../leaderboards/leaderboard.service';

@Injectable()
export class TestAttemptService {
  constructor(
    @InjectModel(TestAttempt.name) private testAttemptModel: Model<TestAttempt>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(User.name) private userModel: Model<User>,
    private leaderboardService: LeaderboardService,
  ) {}

  /**
   * Bat dau lam bai test
   * Logic:
   * 1. Kiem tra quiz co ton tai khong
   * 2. Lay tat ca cau hoi cua quiz
   * 3. Lay tat ca dap an cho moi cau hoi (KHONG bao gom thong tin dung/sai)
   * 4. Tra ve du lieu can thiet de hien thi bai test
   */
  async startTest(
    quiz_id: string,
    userId: string,
  ): Promise<StartTestResponseDto> {
    // 1. Kiem tra quiz co ton tai khong
    const quiz = await this.quizModel.findById(quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // 2. Kiem tra premium quiz access
    if (quiz.is_premium) {
      const user = await this.userModel.findById(userId).populate('package_id');
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Chi admin hoac user co package co gia > 0 moi co the truy cap premium quiz
      const isAdmin = user.role === 'admin';
      const hasPremiumPackage =
        user.package_id &&
        (typeof user.package_id === 'object'
          ? (user.package_id as any).price > 0
          : false);

      if (!isAdmin && !hasPremiumPackage) {
        throw new ForbiddenException(
          'Bạn cần nâng cấp gói premium để truy cập quiz này',
        );
      }
    }

    // 2. Lay tat ca cau hoi cua quiz
    const questions = await this.questionModel
      .find({ quiz_id: quiz._id })
      .sort({ question_number: 1 })
      .lean();

    if (questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    // 3. Lay tat ca dap an cho moi cau hoi (KHONG bao gom thong tin dung/sai)
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.answerModel
          .find({ question_id: question._id })
          .select('_id content') // Khong lay thong tin is_correct
          .lean();

        return {
          _id: question._id,
          content: question.content,
          type: question.type,
          question_number: question.question_number,
          answers: answers,
        };
      }),
    );

    const testAttempt = new this.testAttemptModel({
      quiz_id: new Types.ObjectId(quiz_id),
      user_id: new Types.ObjectId(userId),
      started_at: new Date(),
      status: 'in_progress',
      total_questions: questions.length,
    });

    await testAttempt.save();

    console.log('Created attempt:', {
      _id: (testAttempt._id as Types.ObjectId).toString(),
      user_id: testAttempt.user_id.toString(),
      status: testAttempt.status,
    });

    // 4. Tra ve du lieu can thiet de hien thi bai test
    return {
      attempt_id: (testAttempt._id as Types.ObjectId).toString(),
      quiz: {
        _id: (quiz._id as Types.ObjectId).toString(),
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit || null,
      },
      questions: questionsWithAnswers,
      total_questions: questions.length,
      started_at: testAttempt.started_at.toISOString(),
    };
  }

  /**
   * Nop bai test va tinh diem
   * Logic phuc tap nhat trong he thong:
   * 1. Tim attempt dang in_progress roi moi lay quiz info
   * 2. Lay tat ca cau hoi cua quiz
   * 3. Kiem tra tung cau tra loi:
   *    - Cau hoi co thuoc quiz khong
   *    - Dap an co ton tai khong
   *    - Dap an co thuoc cau hoi khong
   * 4. Tinh diem dua tren so cau dung
   * 5. Tinh thoi gian lam bai
   * 6. Luu ket qua vao database
   */
  async submitTest(submitData: SubmitTestDto, userId: string) {
    // 1. Tìm attempt và lock nó để tránh race condition
    const attempt = await this.testAttemptModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(submitData.attempt_id),
        user_id: new Types.ObjectId(userId),
        status: 'in_progress',
      },
      { status: 'submitting' }, // Temporary status to prevent race condition
      { new: true }
    );

    if (!attempt) {
      throw new NotFoundException(
        'Test attempt not found or already submitted',
      );
    }

    try {
      // Lấy quiz info
      const quiz = await this.quizModel.findById(attempt.quiz_id);
      if (!quiz) {
        // Rollback status if quiz not found
        attempt.status = 'in_progress';
        await attempt.save();
        throw new NotFoundException('Quiz not found');
      }

      // Tính thời gian từ server
      const completedAt = new Date();
      const completionTime = Math.floor(
        (completedAt.getTime() - attempt.started_at.getTime()) / 1000,
      );

      // Check time limit and determine if submission is late
      let isLate = false;
      if (quiz.time_limit && quiz.time_limit > 0) {
        const timeLimitInSeconds = quiz.time_limit * 60;
        const GRACE_PERIOD = 30; // 30 seconds grace period for network delays

        if (completionTime > timeLimitInSeconds + GRACE_PERIOD) {
          // Too late - reject submission completely
          attempt.status = 'abandoned';
          attempt.completed_at = completedAt;
          attempt.completion_time = completionTime;
          await attempt.save();
          
          throw new BadRequestException(
            `Test submission exceeded time limit by too much. Time limit: ${quiz.time_limit} minutes, Time taken: ${Math.ceil(completionTime / 60)} minutes`,
          );
        } else if (completionTime > timeLimitInSeconds) {
          // Late but within grace period - allow but mark as late
          isLate = true;
        }
      }

      // 2. Lấy tất cả câu hỏi của quiz
      const questions = await this.questionModel.find({
        quiz_id: new Types.ObjectId(attempt.quiz_id),
      });

      if (questions.length === 0) {
        // Rollback status if no questions
        attempt.status = 'in_progress';
        await attempt.save();
        throw new BadRequestException('Quiz has no questions');
      }

      // 3. Kiểm tra từng câu trả lời
      let correctAnswers = 0;
      const processedAnswers: Array<{
        question_id: Types.ObjectId;
        selected_answer_id: Types.ObjectId;
        is_correct: boolean;
      }> = [];

      // Duyệt qua từng câu trả lời
      for (const answerSubmission of submitData.answers) {
        // Kiểm tra câu hỏi có tồn tại trong quiz
        const question = questions.find(
          (q) =>
            (q._id as Types.ObjectId).toString() === answerSubmission.question_id,
        );
        if (!question) {
          // Rollback status if invalid question
          attempt.status = 'in_progress';
          await attempt.save();
          throw new BadRequestException(
            `Question ${answerSubmission.question_id} not found in quiz`,
          );
        }

        // Lấy đáp án được chọn
        const selectedAnswer = await this.answerModel.findById(
          answerSubmission.selected_answer_id,
        );
        if (!selectedAnswer) {
          // Rollback status if invalid answer
          attempt.status = 'in_progress';
          await attempt.save();
          throw new BadRequestException(
            `Answer ${answerSubmission.selected_answer_id} not found`,
          );
        }

        // Kiểm tra đáp án có thuộc câu hỏi không (sử dụng toString() để so sánh an toàn)
        if (
          selectedAnswer.question_id.toString() !== answerSubmission.question_id
        ) {
          // Rollback status if answer doesn't belong to question
          attempt.status = 'in_progress';
          await attempt.save();
          throw new BadRequestException(
            'Answer does not belong to the specified question',
          );
        }

        // Kiểm tra đáp án có đúng không và tăng số câu đúng
        const isCorrect = selectedAnswer.is_correct;
        if (isCorrect) {
          correctAnswers++;
        }

        processedAnswers.push({
          question_id: new Types.ObjectId(answerSubmission.question_id),
          selected_answer_id: new Types.ObjectId(
            answerSubmission.selected_answer_id,
          ),
          is_correct: isCorrect,
        });
      }

      const score = Math.round((correctAnswers / questions.length) * 100);

      // Update attempt với kết quả
      attempt.score = score;
      attempt.correct_answers = correctAnswers;
      attempt.incorrect_answers = questions.length - correctAnswers;
      attempt.completion_time = completionTime;
      attempt.completed_at = completedAt;
      attempt.answers = processedAnswers;
      attempt.status = isLate ? 'late' : 'completed';

      await attempt.save();

      // Tự động thêm vào leaderboard nếu test hoàn thành thành công (chỉ giữ score cao nhất)
      if (attempt.status === 'completed' || attempt.status === 'late') {
        try {
          const result = await this.leaderboardService.createOrUpdateBestScore({
            quizId: attempt.quiz_id.toString(),
            userId: attempt.user_id.toString(),
            attemptId: (attempt._id as Types.ObjectId).toString(),
            score: score,
            timeSpent: completionTime,
          });
          
          console.log(`Leaderboard ${result.action}:`, {
            attemptId: (attempt._id as Types.ObjectId).toString(),
            score,
            timeSpent: completionTime,
            action: result.action,
          });
        } catch (leaderboardError) {
          // Log error but don't fail the test submission
          console.error('Failed to update leaderboard:', leaderboardError);
        }
      }

      // Trả về kết quả cho người dùng
      return {
        attempt_id: attempt._id,
        score,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        incorrect_answers: questions.length - correctAnswers,
        completion_time: completionTime,
        percentage: score,
      };
    } catch (error) {
      // Nếu có lỗi và attempt chưa được set status khác, rollback về in_progress
      if (attempt.status === 'submitting') {
        attempt.status = 'in_progress';
        await attempt.save();
      }
      throw error;
    }
  }

  /**
   * Lay lich su lam bai cua nguoi dung
   * Co the xem tat ca hoac chi xem lich su cua 1 quiz cu the
   * Sap xep theo thoi gian moi nhat truoc
   */
  async getTestHistory(userId: string, quizId?: string) {
    const filter: Record<string, any> = { user_id: new Types.ObjectId(userId) };
    if (quizId) {
      filter.quiz_id = new Types.ObjectId(quizId);
    }

    const attempts = await this.testAttemptModel
      .find(filter)
      .populate('quiz_id', 'title description')
      .sort({ completed_at: -1 })
      .lean();

    return attempts.map((attempt) => ({
      _id: attempt._id,
      quiz: attempt.quiz_id,
      score: attempt.score,
      total_questions: attempt.total_questions,
      correct_answers: attempt.correct_answers,
      incorrect_answers: attempt.incorrect_answers,
      completion_time: attempt.completion_time,
      completed_at: attempt.completed_at,
      status: attempt.status,
    }));
  }

  /**
   * Xem chi tiet ket qua 1 lan lam bai cu the
   * Bao gom tat ca cau tra loi, dap an dung, dap an da chon
   * Dung de review lai bai lam sau khi hoan thanh
   */
  async getTestAttemptDetails(attemptId: string, userId: string) {
    const attempt = await this.testAttemptModel
      .findOne({ _id: attemptId, user_id: new Types.ObjectId(userId) })
      .populate('quiz_id', 'title description')
      .populate('answers.question_id', 'content type question_number')
      .populate('answers.selected_answer_id', 'content is_correct')
      .lean();

    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }

    // Lay tat ca dap an dung de so sanh
    const questionIds = attempt.answers.map((a) => a.question_id._id);
    const correctAnswers = await this.answerModel
      .find({
        question_id: { $in: questionIds },
        is_correct: true,
      })
      .lean();

    // Tao map de tim dap an dung nhanh hon
    const correctAnswerMap = correctAnswers.reduce(
      (map, answer) => {
        map[answer.question_id.toString()] = answer;
        return map;
      },
      {} as Record<string, any>,
    );

    return {
      _id: attempt._id,
      quiz: attempt.quiz_id,
      score: attempt.score,
      total_questions: attempt.total_questions,
      correct_answers: attempt.correct_answers,
      incorrect_answers: attempt.incorrect_answers,
      completion_time: attempt.completion_time,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      status: attempt.status,
      answers: attempt.answers.map((answer) => ({
        question: answer.question_id,
        selected_answer: answer.selected_answer_id,
        correct_answer: correctAnswerMap[answer.question_id._id.toString()],
        is_correct: answer.is_correct,
      })),
    };
  }

  /**
   * Cron job to automatically timeout/abandon test attempts that exceed time limit
   * Runs every minute to check for overdue test attempts
   */
  @Cron('0 * * * * *', { name: 'timeoutOverdueAttempts' }) // Run every minute
  async timeoutOverdueAttempts() {
    try {
      // Find all in_progress attempts (not submitting to avoid race condition)
      const inProgressAttempts = await this.testAttemptModel
        .find({
          status: 'in_progress', // Only process truly in_progress, not submitting
        })
        .populate('quiz_id');

      const now = new Date();
      let timeoutCount = 0;

      for (const attempt of inProgressAttempts) {
        const quiz = attempt.quiz_id as any;

        // Skip if quiz is null or doesn't have time limit
        if (!quiz || !quiz.time_limit || quiz.time_limit <= 0) {
          continue;
        }

        const timeLimitInMs = quiz.time_limit * 60 * 1000; // Convert minutes to milliseconds
        const elapsedTime = now.getTime() - attempt.started_at.getTime();

        // If elapsed time exceeds time limit, try to mark as abandoned with race condition protection
        if (elapsedTime > timeLimitInMs) {
          // Use atomic update to prevent race condition with submitTest
          const updatedAttempt = await this.testAttemptModel.findOneAndUpdate(
            {
              _id: attempt._id,
              status: 'in_progress', // Only update if still in_progress
            },
            {
              status: 'abandoned',
              completed_at: now,
              completion_time: Math.floor(elapsedTime / 1000),
            },
            { new: true }
          );

          // Only process if update was successful (means no race condition occurred)
          if (updatedAttempt) {
            // Grade any completed questions
            if (updatedAttempt.answers && updatedAttempt.answers.length > 0) {
              const questions = await this.questionModel.find({
                quiz_id: updatedAttempt.quiz_id,
              });

              let correctAnswers = 0;
              for (const answer of updatedAttempt.answers) {
                if (answer.is_correct) {
                  correctAnswers++;
                }
              }

              updatedAttempt.correct_answers = correctAnswers;
              updatedAttempt.incorrect_answers = updatedAttempt.answers.length - correctAnswers;
              updatedAttempt.score =
                questions.length > 0
                  ? Math.round((correctAnswers / questions.length) * 100)
                  : 0;

              await updatedAttempt.save();
            }
            timeoutCount++;
          }
        }
      }

      if (timeoutCount > 0) {
        console.log(`Automatically timed out ${timeoutCount} test attempts`);
      }
    } catch (error) {
      console.error('Error in timeout cron job:', error);
    }
  }

  /**
   * Helper method to check if a test attempt should be timed out
   * Can be called manually or used in validation
   */
  async checkAndTimeoutAttempt(attemptId: string): Promise<boolean> {
    const attempt = await this.testAttemptModel
      .findById(attemptId)
      .populate('quiz_id');

    if (!attempt || attempt.status !== 'in_progress') {
      return false;
    }

    const quiz = attempt.quiz_id as any;
    if (!quiz || !quiz.time_limit) {
      return false;
    }

    const now = new Date();
    const timeLimitInMs = quiz.time_limit * 60 * 1000;
    const elapsedTime = now.getTime() - attempt.started_at.getTime();

    if (elapsedTime > timeLimitInMs) {
      attempt.status = 'abandoned';
      attempt.completed_at = now;
      attempt.completion_time = Math.floor(elapsedTime / 1000);

      // Grade any completed questions
      if (attempt.answers && attempt.answers.length > 0) {
        const questions = await this.questionModel.find({
          quiz_id: attempt.quiz_id,
        });

        let correctAnswers = 0;
        for (const answer of attempt.answers) {
          if (answer.is_correct) {
            correctAnswers++;
          }
        }

        attempt.correct_answers = correctAnswers;
        attempt.incorrect_answers = attempt.answers.length - correctAnswers;
        attempt.score =
          questions.length > 0
            ? Math.round((correctAnswers / questions.length) * 100)
            : 0;
      }

      await attempt.save();
      return true;
    }

    return false;
  }

  async getTestAttemptById(id: string): Promise<TestAttempt | null> {
    const attempt = await this.testAttemptModel.findById(id);
    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }
    return attempt;
  }
}
