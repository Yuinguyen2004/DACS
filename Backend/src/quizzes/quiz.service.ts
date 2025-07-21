import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as mammoth from 'mammoth'; // Thư viện đọc file .docx
import * as pdfParse from 'pdf-parse'; // Thư viện đọc file .pdf
import { Quiz } from './quiz.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Question } from '../questions/question.schema';
import { Answer } from '../answers/answer.schema';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Thư viện Gemini AI

/**
 * Interface định nghĩa cấu trúc của một câu hỏi được trích xuất từ AI
 */
interface IExtractedQuestion {
  questionNumber: number; // Số thứ tự câu hỏi
  questionText: string; // Nội dung câu hỏi
  questionType: 'mcq' | 'true_false'; // Loại câu hỏi: trắc nghiệm hoặc đúng/sai
  options: string[]; // Danh sách các lựa chọn
  correctAnswer: string; // Đáp án đúng
  explanation: string; // Giải thích cho đáp án
}

/**
 * Service xử lý tất cả logic nghiệp vụ liên quan đến Quiz
 * Bao gồm CRUD operations và import quiz từ file
 */
@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>, // Model Quiz để thao tác với database
    @InjectModel(Question.name) private questionModel: Model<Question>, // Model Question
    @InjectModel(Answer.name) private answerModel: Model<Answer>, // Model Answer
  ) {}

  /**
   * Lấy tất cả quiz từ database
   * @returns Promise<Quiz[]> - Danh sách tất cả quiz kèm thông tin user tạo
   */
  async findAll() {
    return this.quizModel.find().populate('user_id', 'username email');
  }

  /**
   * Lấy một quiz theo ID
   * @param id - ID của quiz cần tìm
   * @returns Promise<Quiz> - Thông tin quiz kèm thông tin user tạo
   */
  async findOne(id: string) {
    return this.quizModel.findById(id).populate('user_id', 'username email');
  }

  /**
   * Tạo quiz mới
   * @param quizData - Dữ liệu quiz cần tạo
   * @param userId - ID của user tạo quiz
   * @returns Promise<Quiz> - Quiz vừa được tạo
   */
  async create(quizData: CreateQuizDto, userId: string) {
    const createdQuiz = new this.quizModel({
      ...quizData,
      user_id: new Types.ObjectId(userId),
    });
    return createdQuiz.save();
  }

  /**
   * Cập nhật thông tin quiz
   * @param id - ID của quiz cần cập nhật
   * @param updateData - Dữ liệu cập nhật
   * @param userId - ID của user thực hiện cập nhật (để kiểm tra quyền)
   * @returns Promise<Quiz> - Quiz sau khi được cập nhật
   * @throws NotFoundException - Khi không tìm thấy quiz
   * @throws ForbiddenException - Khi user không có quyền sửa quiz
   */
  async update(id: string, updateData: UpdateQuizDto, userId: string) {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.user_id.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa quiz này');
    }
    Object.assign(quiz, updateData);
    return quiz.save();
  }

  /**
   * Xóa quiz
   * @param id - ID của quiz cần xóa
   * @param userId - ID của user thực hiện xóa (để kiểm tra quyền)
   * @returns Promise<object> - Thông báo xóa thành công
   * @throws NotFoundException - Khi không tìm thấy quiz
   * @throws ForbiddenException - Khi user không có quyền xóa quiz
   */
  async delete(id: string, userId: string) {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.user_id.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa quiz này');
    }
    await quiz.deleteOne();
    return { message: 'Quiz deleted successfully' };
  }

  /**
   * Import quiz từ file .docx hoặc .pdf
   * Quy trình: Đọc file -> Gửi text lên Gemini AI -> Tạo quiz và câu hỏi
   * @param file - File upload từ client (Express.Multer.File)
   * @param userId - ID của user thực hiện import
   * @returns Promise<object> - Thông tin quiz đã tạo và số lượng câu hỏi
   * @throws BadRequestException - Khi file không đúng định dạng
   */
  async importQuizFromFile(file: Express.Multer.File, userId: string) {
    // 1. Đọc text từ file dựa trên phần mở rộng
    let rawText = '';
    if (file.originalname.endsWith('.docx')) {
      // Sử dụng mammoth để đọc file .docx
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = result.value;
    } else if (file.originalname.endsWith('.pdf')) {
      // Sử dụng pdf-parse để đọc file .pdf
      const result = await pdfParse(file.buffer);
      rawText = result.text;
    } else {
      throw new BadRequestException('Chỉ hỗ trợ file .docx hoặc .pdf');
    }

    // 2. Gửi text lên Gemini AI để trích xuất câu hỏi
    const questions = await this.extractQuizFromTextGemini(rawText);

    // 3. Tạo quiz mới với thông tin cơ bản
    const quiz = await this.quizModel.create({
      title: file.originalname, // Sử dụng tên file làm title
      description: 'Quiz được tạo tự động từ file.',
      user_id: new Types.ObjectId(userId),
      is_premium: false,
    });

    // 4. Lưu từng câu hỏi và đáp án vào database
    for (const q of questions) {
      // Tạo question
      const question = await this.questionModel.create({
        quiz_id: quiz._id,
        content: q.questionText,
        type: q.questionType,
        explanation: q.explanation,
        question_number: q.questionNumber,
      });
      // Tạo các answer cho question
      for (const opt of q.options) {
        await this.answerModel.create({
          question_id: question._id,
          content: opt,
          is_correct: opt === q.correctAnswer, // Đánh dấu đáp án đúng
        });
      }
    }

    return {
      message: 'Tạo quiz thành công!',
      quizId: quiz._id,
      totalQuestions: questions.length,
    };
  }

  /**
   * Private method: Sử dụng Gemini AI để trích xuất câu hỏi từ text
   * @param rawText - Nội dung text được đọc từ file
   * @returns Promise<IExtractedQuestion[]> - Mảng các câu hỏi đã được trích xuất
   * @throws Error - Khi không có GEMINI_API_KEY
   * @throws InternalServerErrorException - Khi có lỗi trong quá trình xử lý AI
   */
  private async extractQuizFromTextGemini(
    rawText: string,
  ): Promise<IExtractedQuestion[]> {
    // Kiểm tra API key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // Khởi tạo Gemini AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
    });

    // Tạo prompt chi tiết cho AI
    const prompt = `
      Dựa vào nội dung sau, hãy trích xuất các câu hỏi trắc nghiệm.
      Trả về một mảng JSON (JSON array) chứa các đối tượng câu hỏi.
      Mỗi đối tượng phải tuân thủ nghiêm ngặt cấu trúc sau:
      {
        "questionNumber": number, // Số thứ tự câu hỏi
        "questionText": "string", // Nội dung câu hỏi
        "questionType": "mcq", // Loại câu hỏi, mặc định là "single-choice"
        "options": ["string"], // Mảng các lựa chọn
        "correctAnswer": "string", // Nội dung của đáp án đúng, phải khớp chính xác với một trong các options
        "explanation": "string" // Giải thích ngắn gọn cho đáp án (nếu có)
      }

      Hãy đảm bảo kết quả trả về CHỈ LÀ MỘT MẢNG JSON hợp lệ, không có ký tự thừa, không có markdown (như \`\`\`json).

      Nội dung cần xử lý:
      ---
      ${rawText}
      ---
    `;

    try {
      // Gửi request đến Gemini AI
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();

      // Parse JSON response từ AI
      const parsedJson = JSON.parse(jsonText);

      // Kiểm tra cơ bản: đảm bảo response là một array
      if (!Array.isArray(parsedJson)) {
        throw new Error('API response is not a JSON array.');
      }

      return parsedJson;
    } catch (error) {
      console.error('Error processing Gemini API response:', error);
      throw new InternalServerErrorException(
        'Không thể phân tích dữ liệu từ AI. Vui lòng thử lại với nội dung khác.',
      );
    }
  }
}
