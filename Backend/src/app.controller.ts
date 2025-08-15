import { Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Email verification success endpoint
   * Handles Firebase email verification redirect with oobCode
   * Processes verification and updates database
   */
  @Get('verify-email-success')
  async verifyEmailSuccess(
    @Query('oobCode') oobCode: string,
    @Query('mode') mode: string,
    @Res() res
  ) {
    if (!oobCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing verification code',
      });
    }

    try {
      await this.authService.verifyEmail(oobCode);
      
      return res.status(200).json({
        success: true,
        message: 'Email verification completed successfully',
        redirectUrl: '/login',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({
        success: false,
        message: 'Email verification failed: ' + error.message,
      });
    }
  }
}
