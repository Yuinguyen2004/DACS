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
import { randomBytes } from 'crypto';
import { TestAttempt } from './test-attempt.schema';
import { Quiz } from '../quizzes/quiz.schema';
import { Question } from '../questions/question.schema';
import { Answer } from '../answers/answer.schema';
import { User } from '../users/user.schema';
import { SubmitTestDto } from './dto/submit-test.dto';
import { StartTestResponseDto } from './dto/start-test-reponse.dto';
import { LeaderboardService } from '../leaderboards/leaderboard.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class TestAttemptService {
  constructor(
    @InjectModel(TestAttempt.name) private testAttemptModel: Model<TestAttempt>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(User.name) private userModel: Model<User>,
    private leaderboardService: LeaderboardService,
    private notificationService: NotificationService,
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

      console.log('Premium check:', {
        userId: user._id.toString(),
        role: user.role,
        package_id: user.package_id,
        package_id_type: typeof user.package_id,
        is_populated: user.package_id && typeof user.package_id === 'object' && 'price' in user.package_id,
      });

      // Chi admin hoac user co package co gia > 0 moi co the truy cap premium quiz
      const isAdmin = user.role === 'admin';
      
      // Kiem tra package_id hop le (khong phai 'guest' string)
      const packageData = user.package_id;
      const hasPremiumPackage =
        packageData &&
        typeof packageData === 'object' &&
        'price' in packageData &&
        (packageData as any).price > 0;

      console.log('Access check result:', { isAdmin, hasPremiumPackage });

      if (!isAdmin && !hasPremiumPackage) {
        throw new ForbiddenException(
          'Bạn cần nâng cấp gói premium để truy cập quiz này',
        );
      }
    }

    // 2. Lay tat ca cau hoi cua quiz
    console.log('Looking for questions with quiz_id:', (quiz._id as Types.ObjectId).toString());
    const questions = await this.questionModel
      .find({ quiz_id: quiz._id })
      .sort({ question_number: 1 })
      .lean();

    console.log('Found questions:', questions.length);

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

    // Tao resume_token
    const resumeToken = randomBytes(32).toString('hex');

    const testAttempt = new this.testAttemptModel({
      quiz_id: new Types.ObjectId(quiz_id),
      user_id: new Types.ObjectId(userId),
      started_at: new Date(),
      status: 'in_progress',
      total_questions: questions.length,
      resume_token: resumeToken,
      last_seen_at: new Date(),
      draft_answers: [],
    });

    await testAttempt.save();

    console.log('Created attempt:', {
      _id: (testAttempt._id as Types.ObjectId).toString(),
      user_id: testAttempt.user_id.toString(),
      status: testAttempt.status,
      resume_token: resumeToken,
    });

    // Tinh remaining seconds
    const remainingSeconds = this.calcRemainingSeconds(testAttempt, quiz);

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
      remainingSeconds,
      resume_token: resumeToken,
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
      { new: true },
    );

    if (!attempt) {
      throw new NotFoundException(
        'Test attempt not found or already submitted',
      );
    }

    const revertToInProgress = async () => {
      await this.testAttemptModel.updateOne(
        {
          _id: attempt._id,
          status: 'submitting',
        },
        { status: 'in_progress' },
      );
    };

    let shouldRollbackStatus = true;

    try {
      // Lấy quiz info
      const quiz = await this.quizModel.findById(attempt.quiz_id);
      if (!quiz) {
        // Rollback status if quiz not found
        await revertToInProgress();
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
          await this.testAttemptModel.updateOne(
            { _id: attempt._id, status: 'submitting' },
            {
              status: 'abandoned',
              completed_at: completedAt,
              completion_time: completionTime,
            },
          );
          shouldRollbackStatus = false;

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
        await revertToInProgress();
        throw new BadRequestException('Quiz has no questions');
      }

      // 3. Kiểm tra từng câu trả lời
      let correctAnswers = 0;
      const processedAnswers: Array<{
        question_id: Types.ObjectId;
        selected_answer_id: Types.ObjectId;
        is_correct: boolean;
      }> = [];

      // Fallback to draft_answers neu khong co answers trong submitData
      const answersToProcess =
        submitData.answers && submitData.answers.length > 0
          ? submitData.answers
          : attempt.draft_answers.map((d) => ({
              question_id: d.question_id.toString(),
              selected_answer_id: d.selected_answer_id.toString(),
            }));

      // Duyệt qua từng câu trả lời
      for (const answerSubmission of answersToProcess) {
        // Kiểm tra câu hỏi có tồn tại trong quiz
        const question = questions.find(
          (q) =>
            (q._id as Types.ObjectId).toString() ===
            answerSubmission.question_id,
        );
        if (!question) {
          // Rollback status if invalid question
          await revertToInProgress();
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
          await revertToInProgress();
          throw new BadRequestException(
            `Answer ${answerSubmission.selected_answer_id} not found`,
          );
        }

        // Kiểm tra đáp án có thuộc câu hỏi không (sử dụng toString() để so sánh an toàn)
        if (
          selectedAnswer.question_id.toString() !== answerSubmission.question_id
        ) {
          // Rollback status if answer doesn't belong to question
          await revertToInProgress();
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

      // Update attempt với kết quả (atomic update để tránh version conflicts)
      const finalizedAttempt =
        await this.testAttemptModel.findOneAndUpdate(
          {
            _id: attempt._id,
            status: 'submitting',
          },
          {
            $set: {
              score,
              correct_answers: correctAnswers,
              incorrect_answers: questions.length - correctAnswers,
              completion_time: completionTime,
              completed_at: completedAt,
              answers: processedAnswers,
              status: isLate ? 'late' : 'completed',
            },
          },
          { new: true },
        );

      if (!finalizedAttempt) {
        // Nếu vì lý do nào đó attempt không còn ở trạng thái submitting
        throw new NotFoundException(
          'Test attempt not found or already submitted',
        );
      }

      shouldRollbackStatus = false;

      // Tự động thêm vào leaderboard nếu test hoàn thành thành công (chỉ giữ score cao nhất)
      if (
        finalizedAttempt.status === 'completed' ||
        finalizedAttempt.status === 'late'
      ) {
        try {
          const result = await this.leaderboardService.createOrUpdateBestScore({
            quizId: finalizedAttempt.quiz_id.toString(),
            userId: finalizedAttempt.user_id.toString(),
            attemptId: (finalizedAttempt._id as Types.ObjectId).toString(),
            score: score,
            timeSpent: completionTime,
          });

          console.log(`Leaderboard ${result.action}:`, {
            attemptId: (finalizedAttempt._id as Types.ObjectId).toString(),
            score,
            timeSpent: completionTime,
            action: result.action,
          });
        } catch (leaderboardError) {
          // Log error but don't fail the test submission
          console.error('Failed to update leaderboard:', leaderboardError);
        }

        // Send notification to user about quiz completion
        try {
          await this.notificationService.create({
            userId: finalizedAttempt.user_id.toString(),
            title: 'Quiz Completed!',
            content: `You have completed "${quiz.title}" with a score of ${score}%. Correct answers: ${correctAnswers}/${questions.length}`,
            type: 'quiz_completion',
            data: {
              quizId: (quiz._id as Types.ObjectId).toString(),
              attemptId: (finalizedAttempt._id as Types.ObjectId).toString(),
              score: score,
              correctAnswers: correctAnswers,
              totalQuestions: questions.length,
              completionTime: completionTime,
            },
          });
          console.log('Quiz completion notification sent to user');
        } catch (notificationError) {
          // Log error but don't fail the test submission
          console.error('Failed to send quiz completion notification:', notificationError);
        }
      }

      // Trả về kết quả cho người dùng
      return {
        attempt_id: finalizedAttempt._id,
        score,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        incorrect_answers: questions.length - correctAnswers,
        completion_time: completionTime,
        percentage: score,
      };
    } catch (error) {
      // Nếu có lỗi và attempt chưa được set status khác, rollback về in_progress
      if (shouldRollbackStatus) {
        await revertToInProgress();
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
      .populate('quiz_id', 'title description time_limit')
      .sort({ started_at: -1 })
      .lean();

    return attempts.map((attempt) => ({
      _id: attempt._id,
      quiz_id: attempt.quiz_id, // Return populated quiz data
      score: attempt.score,
      total_questions: attempt.total_questions,
      correct_answers: attempt.correct_answers,
      incorrect_answers: attempt.incorrect_answers,
      completion_time: attempt.completion_time,
      started_at: attempt.started_at,
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
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid ID format');
    }

    const attempt = await this.testAttemptModel
      .findOne({ _id: new Types.ObjectId(attemptId), user_id: new Types.ObjectId(userId) })
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
   * Helper: Tinh thoi gian con lai (server-authoritative)
   * @returns remainingSeconds (>= 0) hoac null neu khong co time limit
   */
  private calcRemainingSeconds(
    attempt: TestAttempt,
    quiz: Quiz,
  ): number | null {
    if (!quiz.time_limit || quiz.time_limit <= 0) {
      return null; // Khong co gioi han thoi gian
    }

    const timeLimitInSeconds = quiz.time_limit * 60;
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.started_at.getTime()) / 1000,
    );
    const remaining = timeLimitInSeconds - elapsedSeconds;

    return Math.max(0, remaining); // Khong am
  }

  /**
   * Lay active attempt cua user cho quiz nay (neu co)
   */
  async getActiveAttempt(userId: string, quizId: string) {
    const attempt = await this.testAttemptModel
      .findOne({
        user_id: new Types.ObjectId(userId),
        quiz_id: new Types.ObjectId(quizId),
        status: 'in_progress',
      })
      .populate('quiz_id')
      .lean();

    if (!attempt) {
      throw new NotFoundException('No active attempt found for this quiz');
    }

    const quiz = attempt.quiz_id as any;
    const remainingSeconds = this.calcRemainingSeconds(attempt as any, quiz);

    // Lay cac cau hoi va dap an (giong nhu startTest)
    const questions = await this.questionModel
      .find({ quiz_id: quiz._id })
      .sort({ question_number: 1 })
      .lean();

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.answerModel
          .find({ question_id: question._id })
          .select('_id content')
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

    return {
      attempt_id: attempt._id.toString(),
      quiz: {
        _id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit || null,
      },
      questions: questionsWithAnswers,
      total_questions: questions.length,
      started_at: attempt.started_at.toISOString(),
      remainingSeconds,
      draft_answers: attempt.draft_answers || [],
      resume_token: attempt.resume_token,
    };
  }

  /**
   * Heartbeat: Cap nhat last_seen_at va tra ve thoi gian con lai
   */
  async heartbeat(attemptId: string, userId: string) {
    const attempt = await this.testAttemptModel
      .findOne({
        _id: new Types.ObjectId(attemptId),
        user_id: new Types.ObjectId(userId),
        status: 'in_progress',
      })
      .populate('quiz_id');

    if (!attempt) {
      throw new NotFoundException('Test attempt not found or already completed');
    }

    const quiz = attempt.quiz_id as any;
    const remainingSeconds = this.calcRemainingSeconds(attempt, quiz);

    // Cap nhat last_seen_at
    attempt.last_seen_at = new Date();
    await attempt.save();

    return {
      remainingSeconds,
      status: attempt.status,
      last_seen_at: attempt.last_seen_at.toISOString(),
    };
  }

  /**
   * Luu draft answers (idempotent by client_seq)
   */
  async saveAnswers(
    attemptId: string,
    userId: string,
    answers: Array<{
      question_id: string;
      selected_answer_id: string;
      client_seq: number;
    }>,
  ) {
    const attempt = await this.testAttemptModel
      .findOne({
        _id: new Types.ObjectId(attemptId),
        user_id: new Types.ObjectId(userId),
        status: 'in_progress',
      })
      .populate('quiz_id');

    if (!attempt) {
      throw new NotFoundException('Test attempt not found or already completed');
    }

    const quiz = attempt.quiz_id as any;
    const remainingSeconds = this.calcRemainingSeconds(attempt, quiz);

    // Kiem tra time's up
    if (remainingSeconds !== null && remainingSeconds <= 0) {
      throw new ForbiddenException('Time limit exceeded, cannot save answers');
    }

    // Cap nhat draft_answers (idempotent by client_seq)
    for (const answer of answers) {
      const existingIndex = attempt.draft_answers.findIndex(
        (d) => d.question_id.toString() === answer.question_id,
      );

      if (existingIndex >= 0) {
        // Chi cap nhat neu client_seq moi hon
        if (answer.client_seq > attempt.draft_answers[existingIndex].client_seq) {
          attempt.draft_answers[existingIndex] = {
            question_id: new Types.ObjectId(answer.question_id),
            selected_answer_id: new Types.ObjectId(answer.selected_answer_id),
            client_seq: answer.client_seq,
            updated_at: new Date(),
          };
        }
      } else {
        // Them moi
        attempt.draft_answers.push({
          question_id: new Types.ObjectId(answer.question_id),
          selected_answer_id: new Types.ObjectId(answer.selected_answer_id),
          client_seq: answer.client_seq,
          updated_at: new Date(),
        });
      }
    }

    attempt.last_seen_at = new Date();
    await attempt.save();

    return {
      success: true,
      saved_count: answers.length,
      remainingSeconds,
    };
  }

  /**
   * Resume attempt by resume_token
   */
  async resumeByToken(resumeToken: string, userId: string) {
    const attempt = await this.testAttemptModel
      .findOne({
        resume_token: resumeToken,
        user_id: new Types.ObjectId(userId),
        status: 'in_progress',
      })
      .populate('quiz_id')
      .lean();

    if (!attempt) {
      throw new NotFoundException('Resume token invalid or attempt already completed');
    }

    const quiz = attempt.quiz_id as any;
    const remainingSeconds = this.calcRemainingSeconds(attempt as any, quiz);

    // Lay cac cau hoi va dap an
    const questions = await this.questionModel
      .find({ quiz_id: quiz._id })
      .sort({ question_number: 1 })
      .lean();

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.answerModel
          .find({ question_id: question._id })
          .select('_id content')
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

    return {
      attempt_id: attempt._id.toString(),
      quiz: {
        _id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit || null,
      },
      questions: questionsWithAnswers,
      total_questions: questions.length,
      started_at: attempt.started_at.toISOString(),
      remainingSeconds,
      draft_answers: attempt.draft_answers || [],
      resume_token: attempt.resume_token,
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
            { new: true },
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
              updatedAttempt.incorrect_answers =
                updatedAttempt.answers.length - correctAnswers;
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

  
  /**
   * Manually abandon a test attempt (when user leaves the test page)
   * This should be called when the user navigates away or closes the test
   */
  /**
   * Manually abandon a test attempt (when user leaves the test page)
   * This should be called when the user navigates away or closes the test
   */
  async abandonTestAttempt(attemptId: string, userId: string): Promise<boolean> {
    console.log(`[ABANDON] Attempting to abandon attempt ${attemptId} for user ${userId}`);
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      console.log(`[ABANDON] Invalid ID format`);
      return false;
    }

    try {
      // First get the attempt to calculate completion time
      const existingAttempt = await this.testAttemptModel.findOne({
        _id: new Types.ObjectId(attemptId),
        user_id: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!existingAttempt) {
        console.log(`[ABANDON] Attempt ${attemptId} not found or not in progress`);
        return false;
      }

      // Calculate completion time
      const now = new Date();
      const completionTime = Math.floor(
        (now.getTime() - existingAttempt.started_at.getTime()) / 1000
      );

      // Use atomic update to prevent race condition with submitTest
      const attempt = await this.testAttemptModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(attemptId),
          user_id: new Types.ObjectId(userId),
          status: 'in_progress', // Only abandon if still in progress
        },
        {
          status: 'abandoned',
          completed_at: now,
          completion_time: completionTime,
        },
        { new: true }
      );

      if (attempt) {
        console.log(`[ABANDON] Successfully abandoned attempt ${attemptId} after ${completionTime} seconds`);
        return true;
      } else {
        console.log(`[ABANDON] Attempt ${attemptId} not found or already completed/abandoned`);
        return false;
      }
    } catch (error) {
      console.error(`[ABANDON] Error abandoning attempt ${attemptId}:`, error);
      return false;
    }
  }

  async getTestAttemptById(id: string): Promise<TestAttempt | null> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const attempt = await this.testAttemptModel.findById(id);
    return attempt;
  }


}
