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
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { TestAttemptService } from './test-attempt.service';
import { SubmitTestDto } from './dto/submit-test.dto';

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
@UseGuards(FirebaseAuthGuard)
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
    return this.testAttemptService.getTestAttemptDetails(
      id,
      req.user.userId as string,
    );
  }

  
  /**
   * API to abandon a test attempt (when user leaves the test page)
   * This is called when the user navigates away or closes the browser
   */
  @Post('abandon/:id')
  async abandonTestAttempt(@Param('id') id: string, @Request() req: any) {
    const success = await this.testAttemptService.abandonTestAttempt(
      id,
      req.user.userId as string,
    );
    
    return {
      success,
      message: success ? 'Test attempt abandoned successfully' : 'Test attempt could not be abandoned'
    };
  }
}
