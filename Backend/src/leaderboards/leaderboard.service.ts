import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Leaderboard, LeaderboardDocument } from './leaderboard.schema';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { LeaderboardEntryDto, QuizLeaderboardDto } from './dto/leaderboard-response.dto';
import { User } from '../users/user.schema';
import { Quiz } from '../quizzes/quiz.schema';
import { AuditLogService } from './audit-log.service';

/**
 * Service xử lý tất cả logic nghiệp vụ liên quan đến Leaderboard
 * Bao gồm CRUD operations và tính toán ranking
 */
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Leaderboard.name) private leaderboardModel: Model<LeaderboardDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Tạo mới một entry leaderboard
   */
  async create(createLeaderboardDto: CreateLeaderboardDto): Promise<LeaderboardDocument> {
    try {
      // Validate ObjectIds
      if (!Types.ObjectId.isValid(createLeaderboardDto.quizId)) {
        throw new BadRequestException('Invalid quiz ID');
      }
      if (!Types.ObjectId.isValid(createLeaderboardDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Types.ObjectId.isValid(createLeaderboardDto.attemptId)) {
        throw new BadRequestException('Invalid attempt ID');
      }

      // Check if entry already exists for this attempt
      const existingEntry = await this.leaderboardModel.findOne({
        attemptId: new Types.ObjectId(createLeaderboardDto.attemptId),
      });

      if (existingEntry) {
        throw new BadRequestException('Leaderboard entry already exists for this attempt');
      }

      const leaderboard = new this.leaderboardModel({
        ...createLeaderboardDto,
        quizId: new Types.ObjectId(createLeaderboardDto.quizId),
        userId: new Types.ObjectId(createLeaderboardDto.userId),
        attemptId: new Types.ObjectId(createLeaderboardDto.attemptId),
      });

      const savedLeaderboard = await leaderboard.save();
      
      // Recalculate ranks for this quiz
      await this.recalculateRanks(createLeaderboardDto.quizId);
      
      return savedLeaderboard;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create leaderboard entry');
    }
  }

  /**
   * Tạo hoặc cập nhật leaderboard entry (chỉ giữ lại score cao nhất)
   * Logic: 
   * 1. Tìm entry hiện tại của user trong quiz này
   * 2. Nếu chưa có entry -> tạo mới
   * 3. Nếu có entry và score mới cao hơn -> cập nhật
   * 4. Nếu có entry nhưng score mới thấp hơn -> bỏ qua
   */
  async createOrUpdateBestScore(createLeaderboardDto: CreateLeaderboardDto): Promise<{ action: 'created' | 'updated' | 'skipped'; entry: LeaderboardDocument | null }> {
    try {
      // Validate ObjectIds
      if (!Types.ObjectId.isValid(createLeaderboardDto.quizId)) {
        throw new BadRequestException('Invalid quiz ID');
      }
      if (!Types.ObjectId.isValid(createLeaderboardDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Types.ObjectId.isValid(createLeaderboardDto.attemptId)) {
        throw new BadRequestException('Invalid attempt ID');
      }

      // Tìm entry hiện tại của user trong quiz này
      const existingEntry = await this.leaderboardModel.findOne({
        quizId: new Types.ObjectId(createLeaderboardDto.quizId),
        userId: new Types.ObjectId(createLeaderboardDto.userId),
      });

      if (!existingEntry) {
        // Chưa có entry -> tạo mới
        const leaderboard = new this.leaderboardModel({
          ...createLeaderboardDto,
          quizId: new Types.ObjectId(createLeaderboardDto.quizId),
          userId: new Types.ObjectId(createLeaderboardDto.userId),
          attemptId: new Types.ObjectId(createLeaderboardDto.attemptId),
        });

        const savedLeaderboard = await leaderboard.save();
        
        // Recalculate ranks for this quiz
        await this.recalculateRanks(createLeaderboardDto.quizId);
        
        return { action: 'created', entry: savedLeaderboard };
      }

      // Có entry rồi -> so sánh score
      const newScore = createLeaderboardDto.score;
      const currentScore = existingEntry.score;

      if (newScore > currentScore) {
        // Score mới cao hơn -> cập nhật
        existingEntry.score = newScore;
        existingEntry.timeSpent = createLeaderboardDto.timeSpent || 0;
        existingEntry.attemptId = new Types.ObjectId(createLeaderboardDto.attemptId);
        
        const updatedEntry = await existingEntry.save();
        
        // Recalculate ranks for this quiz
        await this.recalculateRanks(createLeaderboardDto.quizId);
        
        return { action: 'updated', entry: updatedEntry };
      } else if (newScore === currentScore && createLeaderboardDto.timeSpent && existingEntry.timeSpent) {
        // Score bằng nhau -> so sánh thời gian (thời gian ít hơn thì tốt hơn)
        if (createLeaderboardDto.timeSpent < existingEntry.timeSpent) {
          existingEntry.timeSpent = createLeaderboardDto.timeSpent || 0;
          existingEntry.attemptId = new Types.ObjectId(createLeaderboardDto.attemptId);
          
          const updatedEntry = await existingEntry.save();
          
          // Recalculate ranks for this quiz
          await this.recalculateRanks(createLeaderboardDto.quizId);
          
          return { action: 'updated', entry: updatedEntry };
        }
      }

      // Score mới thấp hơn hoặc không tốt hơn -> bỏ qua
      return { action: 'skipped', entry: existingEntry };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create or update leaderboard entry');
    }
  }

  /**
   * Lấy leaderboard cho một quiz cụ thể
   */
  async getQuizLeaderboard(quizId: string, limit: number = 50): Promise<QuizLeaderboardDto> {
    try {
      if (!Types.ObjectId.isValid(quizId)) {
        throw new BadRequestException('Invalid quiz ID');
      }

      // Verify quiz exists
      const quiz = await this.quizModel.findById(quizId);
      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Get leaderboard entries with user info
      const entries = await this.leaderboardModel
        .find({ quizId: new Types.ObjectId(quizId) })
        .populate('userId', 'username')
        .sort({ rank: 1 })
        .limit(limit)
        .exec();

      // Get total participants count
      const totalParticipants = await this.leaderboardModel.countDocuments({
        quizId: new Types.ObjectId(quizId),
      });

      const leaderboardEntries: LeaderboardEntryDto[] = entries.map(entry => ({
        rank: entry.rank,
        userId: entry.userId._id.toString(),
        username: (entry.userId as any).username,
        score: entry.score,
        timeSpent: entry.timeSpent,
        completedAt: (entry as any).createdAt,
      }));

      return {
        quizId,
        quizTitle: quiz.title,
        entries: leaderboardEntries,
        totalParticipants,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get quiz leaderboard');
    }
  }

  /**
   * Lấy ranking của một user cụ thể trong một quiz
   */
  async getUserRankInQuiz(quizId: string, userId: string): Promise<{ rank: number; totalParticipants: number; score: number } | null> {
    try {
      if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid quiz ID or user ID');
      }

      const userEntry = await this.leaderboardModel.findOne({
        quizId: new Types.ObjectId(quizId),
        userId: new Types.ObjectId(userId),
      });

      if (!userEntry) {
        return null;
      }

      const totalParticipants = await this.leaderboardModel.countDocuments({
        quizId: new Types.ObjectId(quizId),
      });

      return {
        rank: userEntry.rank,
        totalParticipants,
        score: userEntry.score,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get user rank');
    }
  }

  /**
   * Cập nhật entry leaderboard (admin only với audit logging)
   */
  async update(id: string, updateLeaderboardDto: UpdateLeaderboardDto): Promise<LeaderboardDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid leaderboard ID');
      }

      const updatedLeaderboard = await this.leaderboardModel.findByIdAndUpdate(
        id,
        updateLeaderboardDto,
        { new: true }
      );

      if (!updatedLeaderboard) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      // Recalculate ranks if score was updated
      if ('score' in updateLeaderboardDto && updateLeaderboardDto.score !== undefined) {
        await this.recalculateRanks(updatedLeaderboard.quizId.toString());
      }

      return updatedLeaderboard;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update leaderboard entry');
    }
  }

  /**
   * Cập nhật entry leaderboard với audit logging (admin only)
   */
  async adminUpdate(
    id: string, 
    updateLeaderboardDto: UpdateLeaderboardDto,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LeaderboardDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid leaderboard ID');
      }

      // Get old data for audit log
      const oldEntry = await this.leaderboardModel.findById(id);
      if (!oldEntry) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      const updatedLeaderboard = await this.leaderboardModel.findByIdAndUpdate(
        id,
        updateLeaderboardDto,
        { new: true }
      );

      if (!updatedLeaderboard) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      // Log admin action
      await this.auditLogService.logLeaderboardUpdate(
        adminId,
        adminEmail,
        id,
        oldEntry.toObject(),
        updatedLeaderboard.toObject(),
        ipAddress,
        userAgent
      );

      // Recalculate ranks if score was updated
      if ('score' in updateLeaderboardDto && updateLeaderboardDto.score !== undefined) {
        await this.recalculateRanks(updatedLeaderboard.quizId.toString());
      }

      return updatedLeaderboard;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update leaderboard entry');
    }
  }

  /**
   * Xóa entry leaderboard
   */
  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid leaderboard ID');
      }

      const leaderboard = await this.leaderboardModel.findById(id);
      if (!leaderboard) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      const quizId = leaderboard.quizId.toString();
      await this.leaderboardModel.findByIdAndDelete(id);

      // Recalculate ranks after deletion
      await this.recalculateRanks(quizId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove leaderboard entry');
    }
  }

  /**
   * Xóa entry leaderboard với audit logging (admin only)
   */
  async adminRemove(
    id: string,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid leaderboard ID');
      }

      const leaderboard = await this.leaderboardModel.findById(id);
      if (!leaderboard) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      const quizId = leaderboard.quizId.toString();
      const deletedData = leaderboard.toObject();
      
      await this.leaderboardModel.findByIdAndDelete(id);

      // Log admin action
      await this.auditLogService.logLeaderboardDelete(
        adminId,
        adminEmail,
        id,
        deletedData,
        ipAddress,
        userAgent
      );

      // Recalculate ranks after deletion
      await this.recalculateRanks(quizId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove leaderboard entry');
    }
  }

  /**
   * Tính toán lại ranking cho tất cả entries của một quiz
   */
  private async recalculateRanks(quizId: string): Promise<void> {
    try {
      // Get all entries for this quiz, sorted by score (desc) and time (asc)
      const entries = await this.leaderboardModel
        .find({ quizId: new Types.ObjectId(quizId) })
        .sort({ score: -1, timeSpent: 1 })
        .exec();

      // Update ranks
      const updates = entries.map((entry, index) => ({
        updateOne: {
          filter: { _id: entry._id },
          update: { rank: index + 1 },
        },
      }));

      if (updates.length > 0) {
        await this.leaderboardModel.bulkWrite(updates);
      }
    } catch (error) {
      console.error('Failed to recalculate ranks:', error);
      throw new InternalServerErrorException('Failed to recalculate ranks');
    }
  }

  /**
   * Lấy tất cả leaderboard entries (admin)
   */
  async findAll(): Promise<LeaderboardDocument[]> {
    try {
      return await this.leaderboardModel
        .find()
        .populate('quizId', 'title')
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to get leaderboard entries');
    }
  }

  /**
   * Lấy một entry leaderboard theo ID
   */
  async findOne(id: string): Promise<LeaderboardDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid leaderboard ID');
      }

      const leaderboard = await this.leaderboardModel
        .findById(id)
        .populate('quizId', 'title')
        .populate('userId', 'username')
        .exec();

      if (!leaderboard) {
        throw new NotFoundException('Leaderboard entry not found');
      }

      return leaderboard;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get leaderboard entry');
    }
  }
}