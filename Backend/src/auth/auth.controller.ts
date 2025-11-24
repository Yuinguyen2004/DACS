import {
  Body,
  Controller,
  Post,
  Get,
  UnauthorizedException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto/login.dto';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() dto: LoginDto) {
    // Validate DTO fields exist
    if (!dto.email || !dto.password) {
      throw new UnauthorizedException('Email and password are required');
    }

    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      // Ensure proper error propagation - don't allow fallback
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }

  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(
    @Body()
    dto: {
      email: string;
      password: string;
      name: string;
      username?: string;
    },
  ) {
    try {
      return await this.authService.registerWithFirebase(
        dto.email,
        dto.password,
        dto.name,
        dto.username,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('firebase-login')
  @UsePipes(new ValidationPipe())
  async firebaseLogin(@Body() dto: { idToken: string }) {
    try {
      const decodedToken = await this.authService.validateFirebaseToken(
        dto.idToken,
      );

      if (!decodedToken.email) {
        throw new UnauthorizedException('Invalid token - missing email');
      }

      // Find or create user based on Firebase token
      const usersService = this.authService['usersService']; // Access private service
      let user = await usersService.findByEmail(decodedToken.email);

      if (!user) {
        // Auto-create user from Firebase token
        const userData = await usersService.createFromFirebase({
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          displayName: decodedToken.name || '',
          emailVerified: decodedToken.email_verified || false,
        });
        user = userData;
      }

      // Check if user account is blocked (status: 'inactive')
      if (user.status === 'inactive') {
        throw new UnauthorizedException(
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
        );
      }

      return {
        user,
        firebaseUid: decodedToken.uid,
        message: 'Firebase authentication successful',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('link-firebase')
  @UseGuards(FirebaseAuthGuard)
  async linkFirebase(@Request() req, @Body() dto: { firebaseUid: string }) {
    try {
      const userId = req.user.userId;
      return await this.authService.linkFirebaseToExistingUser(
        userId,
        dto.firebaseUid,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    const usersService = this.authService['usersService'];
    const user = await usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password_hash, ...result } = user.toObject();
    return result;
  }

  @Post('verify-token')
  async verifyToken(@Body() dto: { idToken: string }) {
    try {
      const decodedToken = await this.authService.validateFirebaseToken(
        dto.idToken,
      );
      return {
        valid: true,
        decodedToken,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  @Post('send-verification-email')
  @UseGuards(FirebaseAuthGuard)
  async sendVerificationEmail(@Request() req) {
    try {
      const firebaseUid = req.user.firebaseUid;
      await this.authService.sendEmailVerification(firebaseUid);
      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: { oobCode: string }) {
    try {
      await this.authService.verifyEmail(dto.oobCode);
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('check-verification-status')
  @UseGuards(FirebaseAuthGuard)
  async checkVerificationStatus(@Request() req) {
    try {
      const firebaseUid = req.user.firebaseUid;
      const user = await this.authService.refreshUserVerificationStatus(firebaseUid);
      return {
        emailVerified: user.emailVerified,
        email: user.email,
        firebaseUid: user.firebaseUid,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Manual email verification status sync endpoint
   * Syncs verification status between Firebase and local database
   * Useful for fixing out-of-sync verification states
   */
  @Post('sync-verification-status')
  async syncVerificationStatus(@Body() dto: { email: string }) {
    try {
      return await this.authService.syncVerificationStatusByEmail(dto.email);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('google')
  @UsePipes(new ValidationPipe())
  async googleAuth(
    @Body()
    dto: {
      idToken: string;
      email: string;
      name?: string;
      photoURL?: string;
    },
  ) {
    try {
      // Validate Firebase token first
      const decodedToken = await this.authService.validateFirebaseToken(
        dto.idToken,
      );

      if (!decodedToken.email || decodedToken.email !== dto.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // Find or create user based on Firebase token
      const usersService = this.authService['usersService']; // Access private service
      let user = await usersService.findByEmail(decodedToken.email);

      if (!user) {
        // Auto-create user from Google login
        const userData = await usersService.createFromFirebase({
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          displayName: dto.name || decodedToken.name || '',
          emailVerified: decodedToken.email_verified || false,
          photoURL: dto.photoURL || decodedToken.picture || '',
        });
        user = userData;
      } else {
        // Update existing user with Google info if needed
        if (!user.firebaseUid) {
          const updatedUser = await usersService.updateFirebaseUid(user._id.toString(), decodedToken.uid);
          if (updatedUser) {
            user = updatedUser;
          }
        }
        if (dto.photoURL && user && !user.photoURL) {
          const updatedUser = await usersService.updatePhotoURL(user._id.toString(), dto.photoURL);
          if (updatedUser) {
            user = updatedUser;
          }
        }
      }

      // Return user data and token
      return {
        user,
        firebaseToken: dto.idToken,
        firebaseUid: decodedToken.uid,
        message: 'Google authentication successful',
      };
    } catch (error) {
      console.error('[AUTH] Google auth error:', error);
      throw new UnauthorizedException(error.message);
    }
  }

}
