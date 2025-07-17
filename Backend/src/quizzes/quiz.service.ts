import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './quiz.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private quizModel: Model<Quiz>) {}

  async findAll() {
    return this.quizModel.find().populate('user_id', 'username email');
  }

  async findOne(id: string) {
    return this.quizModel.findById(id).populate('user_id', 'username email');
  }

  async create(quizData: CreateQuizDto, userId: string) {
    const createdQuiz = new this.quizModel({
      ...quizData,
      user_id: new Types.ObjectId(userId),
    });
    return createdQuiz.save();
  }

  async update(id: string, updateData: UpdateQuizDto, userId: string) {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.user_id.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa quiz này');
    }
    Object.assign(quiz, updateData);
    return quiz.save();
  }

  async delete(id: string, userId: string) {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.user_id.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa quiz này');
    }
    await quiz.deleteOne();
    return { message: 'Quiz deleted successfully' };
  }
}
