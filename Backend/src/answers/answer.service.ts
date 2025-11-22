import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Answer } from './answer.schema';

@Injectable()
export class AnswerService {
  constructor(@InjectModel(Answer.name) private answerModel: Model<Answer>) {}

  async findAll() {
    return this.answerModel.find().populate('question_id');
  }

  async findByQuestionId(questionId: string) {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid question ID format');
    }
    return this.answerModel.find({
      question_id: new Types.ObjectId(questionId),
    });
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid answer ID format');
    }
    const answer = await this.answerModel.findById(id);
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }
    return answer;
  }

  async create(answerData: {
    question_id: string;
    content: string;
    is_correct: boolean;
  }) {
    if (!Types.ObjectId.isValid(answerData.question_id)) {
      throw new BadRequestException('Invalid question ID format');
    }

    const newAnswer = new this.answerModel({
      ...answerData,
      question_id: new Types.ObjectId(answerData.question_id),
    });

    return newAnswer.save();
  }

  async update(
    id: string,
    updateData: { content?: string; is_correct?: boolean },
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid answer ID format');
    }

    const answer = await this.answerModel.findById(id);
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    Object.assign(answer, updateData);
    return answer.save();
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid answer ID format');
    }

    const answer = await this.answerModel.findById(id);
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    await answer.deleteOne();
    return { message: 'Answer deleted successfully' };
  }

  async removeByQuestionId(questionId: string) {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid question ID format');
    }

    const result = await this.answerModel.deleteMany({
      question_id: new Types.ObjectId(questionId),
    });

    return {
      message: `${result.deletedCount} answers deleted successfully`,
    };
  }
}
