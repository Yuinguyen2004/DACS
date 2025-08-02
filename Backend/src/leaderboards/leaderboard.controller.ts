import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Types } from 'mongoose';

@Controller('leaderboards')
@UseGuards(AuthGuard('jwt')) // Require authentication for all endpoints
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // ========================================
  // PUBLIC ENDPOINTS (no authentication required)
  // ========================================

  /**
   * Lấy leaderboard cho một quiz cụ thể (PUBLIC)
   */
  @Get('quiz/:quizId')
  @UseGuards() // Override class-level guard to make this public
  async getQuizLeaderboard(
    @Param('quizId') quizId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.leaderboardService.getQuizLeaderboard(quizId, limitNumber);
  }

  /**
   * Lấy ranking của một user cụ thể trong một quiz (PUBLIC)
   */
  @Get('quiz/:quizId/user/:userId')
  @UseGuards() // Override class-level guard to make this public
  async getUserRankInQuiz(
    @Param('quizId') quizId: string,
    @Param('userId') userId: string,
  ) {
    return this.leaderboardService.getUserRankInQuiz(quizId, userId);
  }

  // ========================================
  // USER ENDPOINTS (authentication required)
  // ========================================

  /**
   * Lấy ranking của user hiện tại trong một quiz cụ thể (USER)
   */
  @Get('quiz/:quizId/my-rank')
  async getMyRankInQuiz(@Param('quizId') quizId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.leaderboardService.getUserRankInQuiz(quizId, userId);
  }

  // ========================================
  // ADMIN ENDPOINTS (admin role required)
  // ========================================

  /**
   * Tạo mới một entry leaderboard manually (ADMIN ONLY)
   */
  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe())
  async adminCreate(
    @Body() createLeaderboardDto: CreateLeaderboardDto,
    @Req() req: any,
  ) {
    const adminId = req.user.userId;
    const adminEmail = req.user.email;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.leaderboardService.create(createLeaderboardDto);

    // Log admin creation
    await this.leaderboardService['auditLogService'].logLeaderboardCreate(
      adminId,
      adminEmail,
      (result._id as Types.ObjectId).toString(),
      result.toObject(),
      ipAddress,
      userAgent,
    );

    return result;
  }

  /**
   * Lấy tất cả leaderboard entries (ADMIN ONLY)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminFindAll() {
    return this.leaderboardService.findAll();
  }

  /**
   * Lấy một entry leaderboard theo ID (ADMIN ONLY)
   */
  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminFindOne(@Param('id') id: string) {
    return this.leaderboardService.findOne(id);
  }

  /**
   * Cập nhật entry leaderboard (ADMIN ONLY)
   */
  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe())
  async adminUpdate(
    @Param('id') id: string,
    @Body() updateLeaderboardDto: UpdateLeaderboardDto,
    @Req() req: any,
  ) {
    const adminId = req.user.userId;
    const adminEmail = req.user.email;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.leaderboardService.adminUpdate(
      id,
      updateLeaderboardDto,
      adminId,
      adminEmail,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Xóa entry leaderboard (ADMIN ONLY)
   */
  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminRemove(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.userId;
    const adminEmail = req.user.email;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    await this.leaderboardService.adminRemove(
      id,
      adminId,
      adminEmail,
      ipAddress,
      userAgent,
    );

    return { message: 'Leaderboard entry deleted successfully' };
  }
}
