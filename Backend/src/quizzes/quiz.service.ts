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
  requestedCount?: number; // How many questions were requested
  actualCount?: number; // How many questions were actually generated
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
    const quizzes = await this.quizModel.find().populate('user_id', 'username email');
    
    // Add total question count for each quiz
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const totalQuestions = await this.questionModel.countDocuments({ 
          quiz_id: quiz._id 
        });
        
        return {
          ...quiz.toObject(),
          totalQuestions
        };
      })
    );
    
    return quizzesWithDetails;
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
   * Lấy danh sách quiz không phải premium (miễn phí)
   * @returns Promise<Quiz[]> - Danh sách quiz miễn phí
   */
  async findNonPremiumQuizzes() {
    return this.quizModel
      .find({ is_premium: false })
      .populate('user_id', 'username email');
  }

  /**
   * Lấy danh sách quiz được tạo bởi một user cụ thể
   * @param userId - ID của user cần lấy quiz
   * @returns Promise<Quiz[]> - Danh sách quiz của user kèm số lượng câu hỏi
   */
  async findUserQuizzes(userId: string) {
    const quizzes = await this.quizModel
      .find({ user_id: new Types.ObjectId(userId) })
      .populate('user_id', 'username email')
      .sort({ created_at: -1 }); // Sort by newest first

    // Add totalQuestions count to each quiz
    const quizzesWithQuestionCount = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await this.questionModel.countDocuments({
          quiz_id: quiz._id,
        });
        return {
          ...quiz.toObject(),
          totalQuestions: questionCount,
        };
      })
    );

    return quizzesWithQuestionCount;
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
   * @param desiredQuestionCount - Optional: Desired number of questions (5-100)
   * @returns Promise<object> - Thông tin quiz đã tạo và số lượng câu hỏi
   * @throws BadRequestException - Khi file không đúng định dạng
   */
  async importQuizFromFile(
    file: Express.Multer.File,
    userId: string,
    desiredQuestionCount?: number,
  ) {
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

    // 1. Đọc text từ file dựa trên MIME type (not extension)
    let rawText = '';
    try {
      if (file.mimetype === 'application/pdf') {
        console.log('[IMPORT] Extracting text from PDF...');
        const result = await pdfParse(file.buffer);
        rawText = result.text;
      } else if (
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        console.log('[IMPORT] Extracting text from DOCX...');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawText = result.value;
      } else {
        throw new BadRequestException('Chỉ hỗ trợ file .docx hoặc .pdf');
      }
    } catch (extractError) {
      if (extractError instanceof BadRequestException) {
        throw extractError;
      }
      console.error('[IMPORT] Text extraction failed:', extractError);
      throw new BadRequestException(
        'Không thể đọc nội dung file. Vui lòng đảm bảo file không bị mã hóa hoặc hỏng.',
      );
    }

    // Validate extracted text
    if (!rawText || rawText.trim().length < 50) {
      const fileType = file.mimetype.includes('pdf') ? 'PDF' : 'DOCX';
      throw new BadRequestException(
        `File ${fileType} không chứa đủ nội dung văn bản. ` +
        `Vui lòng kiểm tra file có văn bản có thể đọc được.`,
      );
    }

    // Validate desired question count if provided
    if (desiredQuestionCount !== undefined && desiredQuestionCount !== null) {
      if (desiredQuestionCount < 5 || desiredQuestionCount > 100) {
        throw new BadRequestException(
          'Số lượng câu hỏi mong muốn phải nằm trong khoảng 5-100.',
        );
      }
    }

    // Gọi hàm extract, nhận về object thay vì mảng
    const aiQuizObj = await this.extractQuizFromTextGemini(
      rawText,
      desiredQuestionCount,
    );

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
      totalQuestions: aiQuizObj.actualCount || aiQuizObj.questions?.length || 0,
      requestedCount: aiQuizObj.requestedCount,
      actualCount: aiQuizObj.actualCount,
    };
  }

  /**
   * Process .docx or .pdf file with Gemini AI and return questions data without saving to database
   * For frontend form population (preview before save)
   * @param file - File upload từ client (Express.Multer.File)
   * @param desiredQuestionCount - Optional: Desired number of questions (5-100)
   * @returns Promise<object> - Questions data for frontend
   */
  async processFileWithGemini(
    file: Express.Multer.File,
    desiredQuestionCount?: number,
  ) {
    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File quá lớn. Kích thước tối đa là 5MB.');
    }

    // Validate MIME type - accept both .docx and .pdf
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf', // .pdf
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ file .docx hoặc .pdf.');
    }

    // Read text from file based on type
    let rawText = '';
    try {
      if (file.mimetype === 'application/pdf') {
        console.log('[FILE_PROCESSING] Extracting text from PDF...');
        const result = await pdfParse(file.buffer);
        rawText = result.text;
      } else {
        console.log('[FILE_PROCESSING] Extracting text from DOCX...');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawText = result.value;
      }
    } catch (extractError) {
      console.error('[FILE_PROCESSING] Text extraction failed:', extractError);
      throw new BadRequestException(
        'Không thể đọc nội dung file. Vui lòng đảm bảo: ' +
        '1) File không bị mã hóa hoặc bảo vệ mật khẩu, ' +
        '2) Nếu là PDF, phải chứa văn bản thật (không phải ảnh scan), ' +
        '3) File không bị hỏng.',
      );
    }

    // Validate extracted text
    if (!rawText || rawText.trim().length < 50) {
      const fileType = file.mimetype.includes('pdf') ? 'PDF' : 'DOCX';
      throw new BadRequestException(
        `File ${fileType} không chứa đủ nội dung văn bản (tối thiểu 50 ký tự). ` +
        `Đã trích xuất: ${rawText.length} ký tự. ` +
        `Vui lòng kiểm tra file có chứa văn bản có thể đọc được.`,
      );
    }

    console.log('[FILE_PROCESSING] Extracted text length:', rawText.length);

    // Validate desired question count if provided
    if (desiredQuestionCount !== undefined && desiredQuestionCount !== null) {
      if (desiredQuestionCount < 5 || desiredQuestionCount > 100) {
        throw new BadRequestException(
          'Số lượng câu hỏi mong muốn phải nằm trong khoảng 5-100.',
        );
      }
    }

    // Process with Gemini AI
    const aiQuizObj = await this.extractQuizFromTextGemini(
      rawText,
      desiredQuestionCount,
    );

    // Validate extracted data
    if (!aiQuizObj.questions || aiQuizObj.questions.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng nội dung.',
      );
    }

    // Transform to frontend format
    const questions = aiQuizObj.questions.map((q, index) => ({
      text: q.questionText,
      options: q.options,
      correctAnswerIndex: q.options.findIndex((opt) => opt === q.correctAnswer),
    }));

    // Log success
    console.log('[FILE_PROCESSING] Successfully processed file:', {
      originalName: file.originalname,
      mimeType: file.mimetype,
      questionCount: questions.length,
    });

    return {
      questions: questions,
      totalQuestions: questions.length,
      requestedCount: aiQuizObj.requestedCount,
      actualCount: aiQuizObj.actualCount,
      title: aiQuizObj.title || file.originalname.replace(/\.[^/.]+$/, ''),
      description: aiQuizObj.description || 'Quiz được tạo từ Gemini AI',
    };
  }

  /**
   * Private method: Sử dụng Gemini AI để trích xuất câu hỏi từ text
   * @param rawText - Nội dung text được đọc từ file
   * @param desiredQuestionCount - Số lượng câu hỏi mong muốn (optional, 5-100)
   * @returns Promise<IExtractedQuestion[]> - Mảng các câu hỏi đã được trích xuất
   * @throws Error - Khi không có GEMINI_API_KEY
   * @throws InternalServerErrorException - Khi có lỗi trong quá trình xử lý AI
   */
  private async extractQuizFromTextGemini(
    rawText: string,
    desiredQuestionCount?: number,
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
      model: 'gemini-2.5-flash',
    });

    // Tạo prompt chi tiết cho AI với hướng dẫn cải tiến
    const questionCountInstruction = desiredQuestionCount
      ? `**TARGET QUESTION COUNT: ${desiredQuestionCount}**
Generate approximately ${desiredQuestionCount} high-quality questions from this document.
- If the document has fewer clear questions, create as many as possible (minimum quality threshold).
- If the document has more content, select the ${desiredQuestionCount} most important/representative questions.
`
      : `**AUTOMATIC QUESTION COUNT:**
Generate a reasonable number of questions based on the document length and content quality.
- For short documents: 5-10 questions
- For medium documents: 10-20 questions  
- For long documents: 20-50 questions
`;

    const prompt = `
You are an expert quiz creation AI. Your task is to analyze document content and convert it into fully-formed multiple-choice questions (MCQs).

${questionCountInstruction}

**CRITICAL RULES:**

1. **ALWAYS generate complete MCQs with:**
   - Question text (clear, unambiguous)
   - Exactly 4 options (no more, no less)
   - One correct answer
   - Brief explanation (2-3 sentences)

2. **If source has predefined options (A, B, C, D):**
   - Extract them exactly as written
   - Preserve the original wording
   - Identify the correct answer from indicators like "Answer:", "*", "(correct)", etc.

3. **If source only has correct answer (fill-in-blank or short answer):**
   - Identify the correct answer clearly
   - Generate 3 high-quality distractors (wrong answers) that are:
     * Same category/type as correct answer (e.g., if answer is a city, distractors must be cities)
     * Plausible and believable (not obviously wrong)
     * Contextually relevant to the question topic
   - Example: If correct answer is "Paris", good distractors: "London", "Berlin", "Madrid"
   - Example: If correct answer is "1945", good distractors: "1944", "1946", "1943"

4. **For PDFs with images/tables/charts:**
   - Extract text context around visual elements
   - If question references a visual, indicate it: "Based on the chart/image above..."
   - If visual content is unclear, focus on extractable text

5. **Time limit extraction:**
   - Look for phrases: "Time: 30 minutes", "Duration: 1 hour", "Complete in 45 mins"
   - Convert to minutes (integer): "1 hour" → 60, "30 mins" → 30
   - If not found or ambiguous, set to null

6. **Question numbering:**
   - Preserve original numbering if present
   - If missing, auto-number sequentially from 1

7. **Output format** (JSON only, NO markdown code fences):
{
  "title": "Quiz title from document or generate descriptive one",
  "description": "Brief description of quiz content and topic",
  "time_limit": number or null,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Clear, complete question text",
      "questionType": "mcq",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": "First option",
      "explanation": "Why this answer is correct and why others are incorrect"
    }
  ]
}

**EXAMPLE 1 - Short Answer Format:**

INPUT:
---
1. What is the capital of France?
   Answer: Paris

2. Who wrote "1984"?
   Answer: George Orwell
---

EXPECTED OUTPUT:
{
  "title": "Geography and Literature Quiz",
  "description": "Questions covering world capitals and famous authors",
  "time_limit": null,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "What is the capital of France?",
      "questionType": "mcq",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital and largest city of France, located on the Seine River in northern France."
    },
    {
      "questionNumber": 2,
      "questionText": "Who wrote the dystopian novel '1984'?",
      "questionType": "mcq",
      "options": ["George Orwell", "Aldous Huxley", "Ray Bradbury", "Kurt Vonnegut"],
      "correctAnswer": "George Orwell",
      "explanation": "George Orwell published '1984' in 1949, depicting a totalitarian surveillance state. Other authors wrote similar dystopian works but not this specific novel."
    }
  ]
}

**EXAMPLE 2 - Predefined Options:**

INPUT:
---
Question 1: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Correct Answer: B
---

EXPECTED OUTPUT:
{
  "title": "Mathematics Quiz",
  "description": "Basic arithmetic questions",
  "time_limit": null,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "What is 2 + 2?",
      "questionType": "mcq",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "explanation": "2 + 2 equals 4. This is a fundamental arithmetic operation."
    }
  ]
}

**Now process this content:**
---
${rawText}
---

**Remember**: Return ONLY valid JSON. No markdown, no code fences, no extra text.
`;

    try {
      // Add timeout for AI processing (90 seconds)
      const AI_TIMEOUT = 90000;
      const aiPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT),
      );

      // Race between AI response and timeout
      const result = await Promise.race([aiPromise, timeoutPromise]);
      const response = await (result as any).response;
      let jsonText = response.text();

      // Remove markdown code fences and trim
      jsonText = jsonText.replace(/```json|```/g, '').trim();

      // Sanitize JSON text - remove control characters and fix common issues
      jsonText = jsonText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .trim();

      // Parse JSON response from AI with enhanced error handling
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[AI_PARSE_ERROR] Failed to parse AI response:', {
          error: parseError.message,
          responsePreview: jsonText.substring(0, 500),
          timestamp: new Date().toISOString(),
        });
        throw new InternalServerErrorException(
          'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại hoặc kiểm tra nội dung file.',
        );
      }

      // Validate basic structure
      if (!parsedJson || typeof parsedJson !== 'object') {
        throw new BadRequestException('AI response is not a valid object.');
      }

      // Ensure questions array exists
      if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
        throw new BadRequestException(
          'AI không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng nội dung.',
        );
      }

      // Validate and sanitize time_limit
      if (parsedJson.time_limit !== null && parsedJson.time_limit !== undefined) {
        const timeLimit = parseInt(parsedJson.time_limit);
        if (isNaN(timeLimit) || timeLimit < 0) {
          parsedJson.time_limit = null;
        } else if (timeLimit > 480) {
          parsedJson.time_limit = 480; // Cap at 8 hours
        } else {
          parsedJson.time_limit = timeLimit;
        }
      }

      // Validate and sanitize each question
      for (const [index, question] of parsedJson.questions.entries()) {
        // Sanitize question text
        if (question.questionText) {
          question.questionText = question.questionText
            .trim()
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars
        }

        // Check required fields
        if (
          !question.questionText ||
          typeof question.questionText !== 'string' ||
          !question.questionType ||
          !Array.isArray(question.options) ||
          question.options.length < 2
        ) {
          throw new BadRequestException(
            `Câu hỏi ${index + 1} thiếu thông tin bắt buộc hoặc có cấu trúc không hợp lệ. ` +
            `Cần: nội dung câu hỏi, loại câu hỏi, và ít nhất 2 lựa chọn.`,
          );
        }

        // Ensure exactly 4 options for MCQ (AI should generate this)
        if (question.questionType === 'mcq' && question.options.length !== 4) {
          console.warn(
            `[AI_VALIDATION] Question ${index + 1} has ${question.options.length} options, expected 4`,
          );
        }

        // Validate question type
        if (!['mcq', 'true_false'].includes(question.questionType)) {
          throw new BadRequestException(
            `Câu ${index + 1}: Loại câu hỏi không hợp lệ "${question.questionType}". ` +
            `Chỉ hỗ trợ "mcq" hoặc "true_false".`,
          );
        }

        // Auto-add explanation if missing
        if (!question.explanation || question.explanation.trim() === '') {
          question.explanation = 'Không có lời giải thích.';
          console.warn(`[AI_VALIDATION] Added default explanation for Q${index + 1}`);
        }

        // Validate correctAnswer exists in options with fuzzy matching
        const normalizedCorrect = question.correctAnswer?.trim().toLowerCase();
        if (!normalizedCorrect) {
          throw new BadRequestException(
            `Câu ${index + 1}: Thiếu đáp án đúng.`,
          );
        }

        // Try exact match first
        let matchingOption = question.options.find(
          (opt) => opt.trim().toLowerCase() === normalizedCorrect,
        );

        // If no exact match, try fuzzy match
        if (!matchingOption) {
          matchingOption = question.options.find(
            (opt) =>
              opt.toLowerCase().includes(normalizedCorrect) ||
              normalizedCorrect.includes(opt.toLowerCase()),
          );

          if (matchingOption) {
            console.warn(
              `[AI_VALIDATION] Auto-fixed correctAnswer mismatch in Q${index + 1}: ` +
              `"${question.correctAnswer}" → "${matchingOption}"`,
            );
            question.correctAnswer = matchingOption;
          } else {
            throw new BadRequestException(
              `Câu ${index + 1}: Đáp án đúng "${question.correctAnswer}" không khớp với các lựa chọn. ` +
              `Lựa chọn có: ${question.options.join(', ')}`,
            );
          }
        }

        // Auto-fix question numbers
        if (
          !question.questionNumber ||
          typeof question.questionNumber !== 'number' ||
          question.questionNumber < 1
        ) {
          question.questionNumber = index + 1;
        }
      }

      // Check for duplicate questions (log warning, don't fail)
      const questionTexts = parsedJson.questions.map((q) =>
        q.questionText.toLowerCase().trim(),
      );
      const duplicates = questionTexts.filter(
        (text, idx) => questionTexts.indexOf(text) !== idx,
      );

      if (duplicates.length > 0) {
        console.warn('[AI_VALIDATION] Found duplicate questions:', duplicates);
      }

      // Handle desired question count
      const actualQuestionCount = parsedJson.questions.length;
      let finalQuestions = parsedJson.questions;

      if (desiredQuestionCount && actualQuestionCount > desiredQuestionCount) {
        // AI generated more than requested - slice to desired count
        finalQuestions = parsedJson.questions.slice(0, desiredQuestionCount);
        console.log(
          `[AI_QUESTION_COUNT] Sliced from ${actualQuestionCount} to ${desiredQuestionCount} questions`,
        );
      } else if (
        desiredQuestionCount &&
        actualQuestionCount < desiredQuestionCount
      ) {
        // AI generated fewer than requested - log warning but accept
        console.warn(
          `[AI_QUESTION_COUNT] Requested ${desiredQuestionCount} but only ${actualQuestionCount} could be generated`,
        );
      }

      // Add metadata about question counts
      parsedJson.questions = finalQuestions;
      parsedJson.requestedCount = desiredQuestionCount;
      parsedJson.actualCount = finalQuestions.length;

      // Log success
      console.log('[AI_SUCCESS] Successfully processed quiz:', {
        title: parsedJson.title,
        questionCount: finalQuestions.length,
        requestedCount: desiredQuestionCount,
        timeLimit: parsedJson.time_limit,
      });

      return parsedJson;
    } catch (error) {
      console.error('[AI_ERROR] Error processing Gemini API response:', error);

      // Handle specific error types
      if (error.message === 'AI_TIMEOUT') {
        throw new InternalServerErrorException(
          'Xử lý AI mất quá nhiều thời gian (>90s). File có thể quá phức tạp. ' +
          'Vui lòng thử: 1) Chia nhỏ file, 2) Đơn giản hóa định dạng, 3) Xóa hình ảnh không cần thiết.',
        );
      }

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

      // If it's already a BadRequestException or similar, rethrow it
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // Generic error
      throw new InternalServerErrorException(
        'Không thể phân tích dữ liệu từ AI. Vui lòng thử lại với nội dung khác.',
      );
    }
  }
}
