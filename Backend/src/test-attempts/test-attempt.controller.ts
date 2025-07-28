import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TestAttemptService } from './test-attempt.service';
import { StartTestDto } from './dto/start-test.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { User } from 'src/users/user.schema';
import { TestAttempt } from './test-attempt.schema';

/**
 * Controller xu ly cac API lien quan den viec lam bai test
 * Tat ca API deu can dang nhap (co JWT guard)
 * 4 endpoint chinh:
 * 1. POST /start - bat dau lam bai
 * 2. POST /submit - nop bai
 * 3. GET /history - xem lich su
 * 4. GET /:id - xem chi tiet 1 lan lam
 */
@Controller('test-attempts')
@UseGuards(AuthGuard('jwt'))
export class TestAttemptController {
  constructor(private readonly testAttemptService: TestAttemptService) {}

  /**
   * API bat dau lam bai test
   * Tra ve cau hoi va dap an (khong co thong tin dung/sai)
   */
  @Post('start/:quiz_id')
  async startTest(@Param('quiz_id') quizId: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.testAttemptService.startTest(quizId, userId);
  }

  /**
   * API nop bai test
   * Tinh diem va luu ket qua vao database
   */
  @Post('submit')
  async submitTest(@Body() submitTestDto: SubmitTestDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.testAttemptService.submitTest(submitTestDto, userId);
  }

  /**
   * API xem lich su lam bai
   * Co the loc theo quiz_id neu can
   */
  @Get('history')
  async getTestHistory(@Query('quiz_id') quizId: string, @Request() req: any) {
    return this.testAttemptService.getTestHistory(
      req.user.userId as string,
      quizId,
    );
  }

  /**
   * API xem chi tiet 1 lan lam bai
   * Hien thi dap an dung va sai de review
   */
  @Get(':id')
  async getTestAttemptDetails(@Param('id') id: string, @Request() req: any) {
    // Lay thong tin attempt truoc de kiem tra userId
    const attempt = await this.testAttemptService.getTestAttemptById(id);

    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }

    // Kiem tra xem attempt co thuoc ve user hien tai khong
    if (attempt.user_id.toString() !== req.user.userId) {
      throw new NotFoundException('You can only view your own test attempts');
    }

    return this.testAttemptService.getTestAttemptDetails(
      id,
      req.user.userId as string,
    );
  }
}
