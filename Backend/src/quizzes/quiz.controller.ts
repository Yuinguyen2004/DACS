import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async findAll() {
    return this.quizService.findAll();
  }

  /**
   * Lấy danh sách quiz mà user có thể truy cập
   * Nếu user không có premium package, chỉ trả về quiz free
   */
  @Get('accessible')
  @UseGuards(FirebaseAuthGuard)
  async getAccessibleQuizzes(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.quizService.getUserWithPackage(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isAdmin = user.role === 'admin';
    const hasPremiumPackage =
      user.package_id &&
      (typeof user.package_id === 'object'
        ? (user.package_id as any).price > 0
        : false);

    // Nếu là admin hoặc có premium package, trả về tất cả quiz
    if (isAdmin || hasPremiumPackage) {
      return this.quizService.findAll();
    }

    // Nếu không, chỉ trả về quiz free
    return this.quizService.findNonPremiumQuizzes();
  }

  @Get('my')
  @UseGuards(FirebaseAuthGuard)
  async getMyQuizzes(@Req() req: any) {
    const userId = req.user.userId;
    return this.quizService.findUserQuizzes(userId);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Kiem tra premium quiz access
    if (quiz.is_premium) {
      const user = await this.quizService.getUserWithPackage(req.user.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

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

    return quiz;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(FirebaseAuthGuard)
  async create(@Body() quizData: CreateQuizDto, @Req() req: any) {
    const userId = req.user.userId;

    // Kiểm tra quyền tạo quiz (chỉ admin hoặc premium user)
    await this.checkPremiumAccess(userId, 'tạo quiz');

    return this.quizService.create(quizData, userId);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() quizData: UpdateQuizDto,
    @Req() req: any,
  ) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    let quizUserId = quiz.user_id;
    if (
      typeof quizUserId === 'object' &&
      quizUserId !== null &&
      '_id' in quizUserId
    ) {
      quizUserId = (quizUserId as { _id: any })._id;
    }
    // chuyen doi MongoDB ObjectId sang string de so sanh
    // Admin hoac chu so huu moi co the sua quiz
    const isAdmin = req.user.role === 'admin';
    const isOwner = quizUserId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền sửa quiz này');
    }

    return this.quizService.update(id, quizData, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async delete(@Param('id') id: string, @Req() req: any) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    let quizUserId = quiz.user_id;
    if (
      typeof quizUserId === 'object' &&
      quizUserId !== null &&
      '_id' in quizUserId
    ) {
      quizUserId = (quizUserId as { _id: any })._id;
    }
    // chuyen doi MongoDB ObjectId sang string de so sanh
    // Admin hoac chu so huu moi co the xoa quiz
    const isAdmin = req.user.role === 'admin';
    const isOwner = quizUserId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa quiz này');
    }

    return this.quizService.delete(id, req.user.userId);
  }

  @Post('import')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importQuizzes(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    // Kiểm tra quyền import quiz (chỉ admin hoặc premium user)
    await this.checkPremiumAccess(userId, 'import quiz từ file');

    return this.quizService.importQuizFromFile(file, userId);
  }

  @Post('process-docx')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async processDocxWithGemini(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    // Kiểm tra quyền xử lý file (chỉ admin hoặc premium user)
    await this.checkPremiumAccess(userId, 'xử lý file với AI');

    return this.quizService.processDocxWithGemini(file);
  }

  /**
   * Helper method để kiểm tra quyền premium của user
   */
  private async checkPremiumAccess(userId: string, action: string) {
    const user = await this.quizService.getUserWithPackage(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isAdmin = user.role === 'admin';
    const hasPremiumPackage =
      user.package_id &&
      (typeof user.package_id === 'object'
        ? (user.package_id as any).price > 0
        : false);

    if (!isAdmin && !hasPremiumPackage) {
      throw new ForbiddenException(`Bạn cần nâng cấp gói premium để ${action}`);
    }

    return { user, isAdmin, hasPremiumPackage };
  }
}
