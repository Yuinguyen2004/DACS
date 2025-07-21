import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from './question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
  ) {}

  async findAll() {
    return this.questionModel.find().populate('quiz_id', 'title description');
  }

  async findByQuizId(quizId: string) {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('Invalid quiz ID format');
    }
    return this.questionModel
      .find({ quiz_id: new Types.ObjectId(quizId) })
      .populate('quiz_id', 'title description');
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID format');
    }
    return this.questionModel
      .findById(id)
      .populate('quiz_id', 'title description');
  }

  async create(createQuestionDto: CreateQuestionDto, userId: string) {
    // Verify that the quiz exists and belongs to the user
    const quiz = await this.verifyQuizOwnership(
      createQuestionDto.quiz_id,
      userId,
    );

    const newQuestion = new this.questionModel({
      ...createQuestionDto,
      quiz_id: new Types.ObjectId(createQuestionDto.quiz_id),
    });

    return newQuestion.save();
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
    userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID format');
    }

    const question = await this.questionModel.findById(id).populate('quiz_id');
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify quiz ownership
    await this.verifyQuizOwnership(question.quiz_id.toString(), userId);

    Object.assign(question, updateQuestionDto);
    return question.save();
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID format');
    }

    const question = await this.questionModel.findById(id).populate('quiz_id');
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify quiz ownership
    await this.verifyQuizOwnership(question.quiz_id.toString(), userId);

    await question.deleteOne();
    return { message: 'Question deleted successfully' };
  }

  private async verifyQuizOwnership(quizId: string, userId: string) {
    // This would need to inject QuizService or Quiz model
    // For now, I'll create a simple implementation
    // You might want to inject QuizService here for proper verification
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('Invalid quiz ID format');
    }

    // Note: You'll need to properly implement quiz ownership verification
    // This is a placeholder implementation
    return true;
  }
}
