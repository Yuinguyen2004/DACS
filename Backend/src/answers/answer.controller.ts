import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get()
  async findAll() {
    return this.answerService.findAll();
  }

  @Get('question/:questionId')
  async findByQuestionId(@Param('questionId') questionId: string) {
    return this.answerService.findByQuestionId(questionId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.answerService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body()
    answerData: {
      question_id: string;
      content: string;
      is_correct: boolean;
    },
  ) {
    return this.answerService.create(answerData);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateData: { content?: string; is_correct?: boolean },
  ) {
    return this.answerService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.answerService.remove(id);
  }

  @Delete('question/:questionId')
  @UseGuards(AuthGuard('jwt'))
  async removeByQuestionId(@Param('questionId') questionId: string) {
    return this.answerService.removeByQuestionId(questionId);
  }
}
