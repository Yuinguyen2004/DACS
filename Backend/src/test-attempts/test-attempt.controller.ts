import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TestAttemptService } from './test-attempt.service';
import { StartTestDto } from './dto/start-test.dto';
import { SubmitTestDto } from './dto/submit-test.dto';

@Controller('test-attempts')
@UseGuards(AuthGuard('jwt'))
export class TestAttemptController {
  constructor(private readonly testAttemptService: TestAttemptService) {}

  @Post('start')
  async startTest(@Body() startTestDto: StartTestDto, @Request() req: any) {
    return this.testAttemptService.startTest(
      startTestDto.quiz_id,
      req.user.userId as string,
    );
  }

  @Post('submit')
  async submitTest(@Body() submitTestDto: SubmitTestDto, @Request() req: any) {
    return this.testAttemptService.submitTest(submitTestDto, req.user.userId as string);
  }

  @Get('history')
  async getTestHistory(@Query('quiz_id') quizId: string, @Request() req: any) {
    return this.testAttemptService.getTestHistory(req.user.userId as string, quizId);
  }

  @Get(':id')
  async getTestAttemptDetails(@Param('id') id: string, @Request() req: any) {
    return this.testAttemptService.getTestAttemptDetails(id, req.user.userId as string);
  }
}
