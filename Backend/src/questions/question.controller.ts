import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll() {
    return this.questionService.findAll();
  }

  @Get('quiz/:quizId')
  async findByQuizId(@Param('quizId') quizId: string) {
    return this.questionService.findByQuizId(quizId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const question = await this.questionService.findOne(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: any) {
    return this.questionService.create(createQuestionDto, req.user.userId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: any,
  ) {
    return this.questionService.update(id, updateQuestionDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.questionService.remove(id, req.user.userId);
  }
}
