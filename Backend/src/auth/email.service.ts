import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendVerificationEmail(email: string, verificationLink: string, displayName?: string): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured. Verification link:', verificationLink);
      return;
    }

    const fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@yourapp.com';
    const appName = this.configService.get<string>('APP_NAME') || 'DACS E-learning';

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: appName,
      },
      subject: `Verify Your Email Address - ${appName}`,
      html: this.getVerificationEmailTemplate(verificationLink, displayName, appName),
      text: `Hi ${displayName || 'there'}! Please verify your email address by clicking this link: ${verificationLink}`,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      this.logger.error('SendGrid error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  private getVerificationEmailTemplate(verificationLink: string, displayName?: string, appName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; background: #007bff; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #0056b3; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
              .link-fallback { word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px; margin: 10px 0; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>📧 Verify Your Email</h1>
          </div>
          <div class="content">
              <h2>Hi ${displayName || 'there'}! 👋</h2>
              
              <p>Thank you for signing up for <strong>${appName || 'DACS E-learning'}</strong>!</p>
              
              <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" class="button">✅ Verify Email Address</a>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                  <li>This verification link will expire in <strong>24 hours</strong></li>
                  <li>You won't be able to access all features until your email is verified</li>
                  <li>If you didn't create this account, please ignore this email</li>
              </ul>
              
              <p><strong>Having trouble with the button?</strong> Copy and paste this link into your browser:</p>
              <div class="link-fallback">
                  ${verificationLink}
              </div>
          </div>
          <div class="footer">
              <p>This email was sent by ${appName || 'DACS E-learning'}. If you have any questions, please contact our support team.</p>
              <p>© ${new Date().getFullYear()} ${appName || 'DACS E-learning'}. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email: string, displayName?: string): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured. Skipping welcome email for:', email);
      return;
    }

    const fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@yourapp.com';
    const appName = this.configService.get<string>('APP_NAME') || 'DACS E-learning';

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: appName,
      },
      subject: `Welcome to ${appName}! 🎉`,
      html: `
        <h2>Welcome to ${appName}! 🎉</h2>
        <p>Hi ${displayName || 'there'},</p>
        <p>Your email has been verified successfully! You now have full access to all features.</p>
        <p>Start exploring:</p>
        <ul>
          <li>📚 Browse quizzes and tests</li>
          <li>📊 Track your progress</li>
          <li>🏆 Compete on leaderboards</li>
        </ul>
        <p>Happy learning!<br>The ${appName} Team</p>
      `,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email - it's not critical
    }
  }
}