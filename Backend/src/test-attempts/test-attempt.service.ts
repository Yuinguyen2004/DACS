import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestAttempt } from './test-attempt.schema';
import { Quiz } from '../quizzes/quiz.schema';
import { Question } from '../questions/question.schema';
import { Answer } from '../answers/answer.schema';
import { SubmitTestDto } from './dto/submit-test.dto';

@Injectable()
export class TestAttemptService {
  constructor(
    @InjectModel(TestAttempt.name) private testAttemptModel: Model<TestAttempt>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
  ) {}

  /**
 * Bat dau lam bai test
 * Logic: 
 * 1. Kiem tra quiz co ton tai khong
 * 2. Lay tat ca cau hoi cua quiz
 * 3. Lay tat ca dap an cho moi cau hoi (KHONG bao gom thong tin dung/sai)
 * 4. Tra ve du lieu can thiet de hien thi bai test
 */
async startTest(quiz_id: string, _userId: string) {
    // Xac nhan quiz co ton tai
    const quiz = await this.quizModel.findById(quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Get all questions for this quiz with their answers
    const questions = await this.questionModel
      .find({ quiz_id: quiz._id })
      .sort({ question_number: 1 })
      .lean();

    if (questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    // Get answers for all questions
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.answerModel
          .find({ question_id: question._id })
          .select('_id content') // Don't include is_correct in response
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
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
      },
      questions: questionsWithAnswers,
      total_questions: questions.length,
      started_at: new Date().toISOString(),
    };
  }

  /**
 * Nop bai test va tinh diem
 * Logic phuc tap nhat trong he thong:
 * 1. Kiem tra quiz co ton tai
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
    // Xac thuc quiz co ton tai
    const quiz = await this.quizModel.findById(submitData.quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Get all questions for this quiz
    const questions = await this.questionModel.find({
      quiz_id: new Types.ObjectId(submitData.quiz_id),
    });

    if (questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    // Validate all answers and calculate score
    let correctAnswers = 0;
    const processedAnswers: Array<{
      question_id: Types.ObjectId;
      selected_answer_id: Types.ObjectId;
      is_correct: boolean;
    }> = [];

    // Kiem tra tung cau tra loi mot cach chi tiet
    for (const answerSubmission of submitData.answers) {
      // Verify question belongs to the quiz
      const question = questions.find(
        (q) =>
          (q._id as Types.ObjectId).toString() === answerSubmission.question_id,
      );
      if (!question) {
        throw new BadRequestException(
          `Question ${answerSubmission.question_id} not found in quiz`,
        );
      }

      // Get the selected answer
      const selectedAnswer = await this.answerModel.findById(
        answerSubmission.selected_answer_id,
      );
      if (!selectedAnswer) {
        throw new BadRequestException(
          `Answer ${answerSubmission.selected_answer_id} not found`,
        );
      }

      // Verify answer belongs to the question
      if (
        selectedAnswer.question_id.toString() !== answerSubmission.question_id
      ) {
        throw new BadRequestException(
          'Answer does not belong to the specified question',
        );
      }

      // Kiem tra dap an co dung khong va tang so cau dung
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

    // Tinh thoi gian va diem so
    const startedAt = new Date(submitData.started_at);
    const completedAt = new Date(submitData.completed_at);
    const completionTime = Math.floor(
      (completedAt.getTime() - startedAt.getTime()) / 1000,
    );
    const score = Math.round((correctAnswers / questions.length) * 100);

    // Luu ket qua vao database
    const testAttempt = new this.testAttemptModel({
      quiz_id: new Types.ObjectId(submitData.quiz_id),
      user_id: new Types.ObjectId(userId),
      score,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      incorrect_answers: questions.length - correctAnswers,
      completion_time: completionTime,
      started_at: startedAt,
      completed_at: completedAt,
      answers: processedAnswers,
      status: 'completed',
    });

    await testAttempt.save();

    // Tra ve ket qua cho nguoi dung
    return {
      attempt_id: testAttempt._id,
      score,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      incorrect_answers: questions.length - correctAnswers,
      completion_time: completionTime,
      percentage: score,
    };
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
}
