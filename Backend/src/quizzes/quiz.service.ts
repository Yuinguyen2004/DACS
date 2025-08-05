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
import { User } from '../users/user.schema';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Thư viện Gemini AI

interface IExtractedQuiz {
  title?: string;
  description?: string;
  image?: string;
  time_limit?: number;
  questions: IExtractedQuestion[];
}

// Định nghĩa interface cho từng câu hỏi trích xuất
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
    @InjectModel(User.name) private userModel: Model<User>, // Model User for premium access
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
   * Giup lay thong tin package cua user
   * @param userId - ID của user cần lấy thông tin package
   * @returns Promise<User> - Thông tin user kèm thông tin package
   */
  async getUserWithPackage(userId: string) {
    return this.userModel.findById(userId).populate('package_id');
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
    if (quiz.user_id.toString() !== userId.toString()) {
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
    if (quiz.user_id.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền xóa quiz này');
    }
    // 1. Lấy tất cả question của quiz
    const questions = await this.questionModel.find({ quiz_id: quiz._id });

    // 2. Lấy mảng question_id để xóa answer liên quan
    const questionIds = questions.map((q) => q._id);

    // 3. Xóa tất cả answer của các question này
    await this.answerModel.deleteMany({ question_id: { $in: questionIds } });

    // 4. Xóa tất cả question của quiz này
    await this.questionModel.deleteMany({ quiz_id: quiz._id });

    // 5. Xóa quiz
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
    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File quá lớn. Kích thước tối đa là 5MB.');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf', // .pdf
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ file .docx hoặc .pdf');
    }

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

    // Gọi hàm extract, nhận về object thay vì mảng
    const aiQuizObj = await this.extractQuizFromTextGemini(rawText);

    // Validate time_limit from AI response
    let validatedTimeLimit = aiQuizObj.time_limit ?? null;
    if (validatedTimeLimit !== null && validatedTimeLimit !== undefined) {
      if (validatedTimeLimit < 1) {
        validatedTimeLimit = null; // Invalid, set to no limit
      } else if (validatedTimeLimit > 480) {
        validatedTimeLimit = 480; // Cap at 8 hours
      }
    }

    const quizMeta = {
      title: aiQuizObj.title || file.originalname.replace(/\.[^/.]+$/, ''),
      description: aiQuizObj.description || 'Quiz được tạo tự động từ file.',
      image: aiQuizObj.image || null, // add image support
      time_limit: validatedTimeLimit,
      user_id: new Types.ObjectId(userId),
      is_premium: false,
    };

    // Validate extracted quiz data
    if (!aiQuizObj.questions || aiQuizObj.questions.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra nội dung file.',
      );
    }
    // Tạo quiz mới, có trường time_limit
    const quiz = await this.quizModel.create(quizMeta);
    // Lưu từng câu hỏi/đáp án
    for (const q of aiQuizObj.questions || []) {
      const question = await this.questionModel.create({
        quiz_id: quiz._id,
        content: q.questionText,
        type: q.questionType,
        explanation: q.explanation,
        question_number: q.questionNumber,
      });
      for (const opt of q.options) {
        await this.answerModel.create({
          question_id: question._id,
          content: opt,
          is_correct: opt === q.correctAnswer,
        });
      }
    }

    return {
      message: 'Tạo quiz thành công!',
      totalQuestions: aiQuizObj.questions?.length || 0,
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
  ): Promise<IExtractedQuiz> {
    // Kiểm tra API key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY environment variable is not set',
      );
    }

    // Khởi tạo Gemini AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
    });

    // Tạo prompt chi tiết cho AI
    const prompt = `
    Bạn là một trợ lý AI chuyên xử lý tài liệu, có nhiệm vụ phân tích nội dung văn bản (được trích xuất từ file DOCX, PDF, hoặc văn bản thô) và chuyển đổi các câu hỏi trong đó thành một đối tượng JSON có cấu trúc chặt chẽ.
    **Nhiệm vụ chính:**
Dựa vào nội dung sau, hãy trích xuất thành object JSON với cấu trúc sau:
{
  "title": "[Tiêu đề bài kiểm tra, nếu có]",
  "description": "[Mô tả, nếu có]",
  "time_limit": [số phút làm bài, nếu không có để null hoặc 0],
  "questions": [
    {
      "questionNumber": number, // Số thứ tự câu hỏi 
      "questionText": "string", // Nội dung câu hỏi
      "questionType": "mcq" | "true_false", // Loại câu hỏi: trắc nghiệm hoặc đúng/sai
      "options": ["string"], // Danh sách các lựa chọn, ít nhất 2 lựa chọn
      "correctAnswer": "string", // Nội dung của đáp án đúng, phải khớp chính xác với một trong các options
      "explanation": "string" // Giải thích cho đáp án, nếu có
    }
  ]
}
Chỉ trả về object JSON hợp lệ, không có markdown, không có ký tự thừa.

Nội dung cần xử lý:
---
${rawText}
---
`;

    try {
      // Gửi request đến Gemini AI
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let jsonText = response.text();

      jsonText = jsonText.replace(/```json|```/g, '').trim();

      // Parse JSON response từ AI với error handling
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', jsonText);
        throw new InternalServerErrorException(
          'Phản hồi từ AI không đúng định dạng JSON. Vui lòng thử lại.',
        );
      }

      // Validate basic structure
      if (!parsedJson || typeof parsedJson !== 'object') {
        throw new BadRequestException('AI response is not a valid object.');
      }

      // Kiểm tra cơ bản: đảm bảo response có cấu trúc đúng
      if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
        throw new BadRequestException(
          'API response không có mảng questions hợp lệ.',
        );
      }

      // Validate each question structure
      for (const [index, question] of parsedJson.questions.entries()) {
        // Check required fields
        if (
          !question.questionText ||
          typeof question.questionText !== 'string' ||
          !question.questionType ||
          !Array.isArray(question.options) ||
          question.options.length < 2
        ) {
          throw new BadRequestException(
            `Cấu trúc câu hỏi ${index + 1} không hợp lệ từ AI response.`,
          );
        }

        if (!['mcq', 'true_false'].includes(question.questionType)) {
          throw new BadRequestException(
            `Loại câu hỏi không được hỗ trợ ở câu ${index + 1}: ${question.questionType}`,
          );
        }

        // Validate correct answer exists in options
        if (
          !question.correctAnswer ||
          !question.options.includes(question.correctAnswer)
        ) {
          throw new BadRequestException(
            `Đáp án đúng của câu ${index + 1} không có trong danh sách lựa chọn.`,
          );
        }

        // Validate question number
        if (
          question.questionNumber &&
          (typeof question.questionNumber !== 'number' ||
            question.questionNumber < 1)
        ) {
          question.questionNumber = index + 1; // Auto-fix invalid question numbers
        }
      }
      return parsedJson;
    } catch (error) {
      console.error('Error processing Gemini API response:', error);

      if (error instanceof SyntaxError) {
        throw new InternalServerErrorException(
          'Phản hồi từ AI không đúng định dạng JSON. Vui lòng thử lại.',
        );
      }

      if (error.message?.includes('API')) {
        throw new InternalServerErrorException(
          'Lỗi kết nối API AI. Vui lòng kiểm tra cấu hình hoặc thử lại sau.',
        );
      }

      throw new InternalServerErrorException(
        'Không thể phân tích dữ liệu từ AI. Vui lòng thử lại với nội dung khác.',
      );
    }
  }
}
