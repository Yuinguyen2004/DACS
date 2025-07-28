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
import { AuthGuard } from '@nestjs/passport';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async findAll() {
    return this.quizService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() quizData: CreateQuizDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.quizService.create(quizData, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async importQuizzes(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.quizService.importQuizFromFile(file, userId);
  }
}
