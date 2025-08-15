// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/user.service';
import { FirebaseConfigService } from './firebase.config';
import { EmailService } from './email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseConfig: FirebaseConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    // Check if user has a password (not a Firebase-only user)
    if (!user.password_hash) {
      throw new UnauthorizedException(
        'This account uses Firebase authentication. Please use your Firebase login method.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Wrong password');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    try {
      // Create a custom Firebase token for the user
      let firebaseUid = user.firebaseUid;

      // If user doesn't have Firebase UID, create Firebase user
      if (!firebaseUid) {
        try {
          const firebaseUser = await this.firebaseConfig.createUser({
            email: user.email,
            password: password,
            displayName: user.name,
          });
          firebaseUid = firebaseUser.uid;

          // Update local user with Firebase UID
          await this.usersService.updateFirebaseUid(
            user._id.toString(),
            firebaseUid,
          );
        } catch (firebaseError) {
          // If user already exists in Firebase, get their UID
          const existingFirebaseUser =
            await this.firebaseConfig.getUserByEmail(email);
          if (existingFirebaseUser) {
            firebaseUid = existingFirebaseUser.uid;
            await this.usersService.updateFirebaseUid(
              user._id.toString(),
              firebaseUid,
            );
          } else {
            throw firebaseError;
          }
        }
      }

      // Create custom Firebase token
      const customToken = await this.firebaseConfig.createCustomToken(
        firebaseUid,
        {
          role: user.role,
          userId: user._id.toString(),
        },
      );

      const { password_hash, ...result } = user.toObject();
      return {
        user: result,
        firebaseToken: customToken,
        firebaseUid: firebaseUid,
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      throw new UnauthorizedException('Failed to authenticate with Firebase');
    }
  }

  async registerWithFirebase(
    email: string,
    password: string,
    name: string,
    username?: string,
  ) {
    try {
      // Create Firebase user first
      const firebaseUser = await this.firebaseConfig.createUser({
        email,
        password,
        displayName: name,
      });

      // Create local user with password hash for traditional login support
      const localUser = await this.usersService.createWithFirebase({
        email,
        password,
        name,
        username,
        firebaseUid: firebaseUser.uid,
        displayName: name,
        emailVerified: false,
      });

      // Create custom token
      const customToken = await this.firebaseConfig.createCustomToken(
        firebaseUser.uid,
        {
          role: localUser.role,
          userId: localUser._id.toString(),
        },
      );

      return {
        user: localUser,
        firebaseToken: customToken,
        firebaseUid: firebaseUser.uid,
      };
    } catch (error) {
      console.error('Firebase registration error:', error);
      throw new BadRequestException('Failed to register with Firebase');
    }
  }

  async validateFirebaseToken(idToken: string) {
    try {
      const decodedToken = await this.firebaseConfig.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async linkFirebaseToExistingUser(userId: string, firebaseUid: string) {
    return this.usersService.linkFirebaseAccount(userId, firebaseUid);
  }

  // Legacy method for backward compatibility
  async legacyLogin(email: string, password: string) {
    const user = await this.validateUser(email, password);
    // This creates a temporary JWT for transition period
    // Remove this method once fully migrated to Firebase
    throw new UnauthorizedException('Please use Firebase authentication');
  }

  /**
   * Sends email verification link to user
   * Creates custom verification URL that directly calls our backend with oobCode
   * @param firebaseUid - Firebase user ID
   */
  async sendEmailVerification(firebaseUid: string) {
    try {
      const firebaseUser = await this.firebaseConfig.getAuth().getUser(firebaseUid);
      
      const actionCodeSettings = {
        url: process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'http://localhost:3000/verify-email-success',
        handleCodeInApp: true,
      };

      // Generate Firebase verification link with oobCode
      const link = await this.firebaseConfig.getAuth().generateEmailVerificationLink(
        firebaseUser.email!,
        actionCodeSettings
      );
      
      // Extract oobCode from Firebase link
      const url = new URL(link);
      const oobCode = url.searchParams.get('oobCode');
      
      if (!oobCode) {
        throw new Error('Could not extract oobCode from Firebase link');
      }
      
      // Create custom verification URL that goes directly to our backend
      const baseUrl = process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'http://localhost:3000/verify-email-success';
      const customVerificationUrl = `${baseUrl}?oobCode=${oobCode}&mode=verifyEmail`;

      await this.emailService.sendVerificationEmail(
        firebaseUser.email!,
        customVerificationUrl,
        firebaseUser.displayName
      );
      
      return { 
        verificationLink: customVerificationUrl,
        emailSent: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Send verification email error:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /**
   * Verifies user email using Firebase oobCode and updates local database
   * @param oobCode - Firebase out-of-band verification code
   */
  async verifyEmail(oobCode: string) {
    try {
      // Use Firebase REST API to verify the email
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.FIREBASE_WEB_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oobCode: oobCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Verification failed');
      }

      const data = await response.json();
      const userEmail = data.email;
      
      // Find and update local user verification status
      const user = await this.usersService.findByEmail(userEmail);
      
      if (user && user.firebaseUid) {
        await this.refreshUserVerificationStatus(user.firebaseUid);
      } else if (user && !user.firebaseUid) {
        // Fallback: update directly if user exists but has no firebaseUid
        await this.usersService.updateFirebaseVerificationStatus(
          user._id.toString(),
          true
        );
      }

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('Email verification error:', error);
      throw new BadRequestException('Invalid or expired verification code');
    }
  }

  /**
   * Syncs email verification status from Firebase to local database
   * @param firebaseUid - Firebase user ID
   */
  async refreshUserVerificationStatus(firebaseUid: string) {
    try {
      const firebaseUser = await this.firebaseConfig.getAuth().getUser(firebaseUid);
      const localUser = await this.usersService.findByFirebaseUid(firebaseUid);
      
      if (!localUser) {
        throw new BadRequestException('User not found');
      }

      // Compare verification status between Firebase and local database
      const currentEmailVerified = localUser.emailVerified || false;
      const firebaseEmailVerified = firebaseUser.emailVerified || false;

      // Update local database if verification status differs
      if (currentEmailVerified !== firebaseEmailVerified) {
        await this.usersService.updateFirebaseVerificationStatus(
          localUser._id.toString(),
          firebaseEmailVerified
        );
      }

      return {
        emailVerified: firebaseEmailVerified,
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
      };
    } catch (error) {
      console.error('Refresh verification status error:', error);
      throw new BadRequestException('Failed to check verification status');
    }
  }

  /**
   * Manually syncs email verification status for a user by email address
   * Useful for fixing verification status when Firebase and local database are out of sync
   * @param email - User's email address
   */
  async syncVerificationStatusByEmail(email: string) {
    try {
      const localUser = await this.usersService.findByEmail(email);
      if (!localUser) {
        throw new BadRequestException('User not found');
      }

      if (!localUser.firebaseUid) {
        return { 
          emailVerified: false, 
          message: 'User has no Firebase UID' 
        };
      }

      const firebaseUser = await this.firebaseConfig.getAuth().getUser(localUser.firebaseUid);
      const currentEmailVerified = localUser.emailVerified || false;
      const firebaseEmailVerified = firebaseUser.emailVerified || false;

      // Update local database if Firebase shows verified but local doesn't
      if (firebaseEmailVerified && !currentEmailVerified) {
        await this.usersService.updateFirebaseVerificationStatus(
          localUser._id.toString(),
          true
        );
        
        return {
          emailVerified: true,
          message: 'Verification status updated from Firebase',
          wasUpdated: true
        };
      }

      return {
        emailVerified: firebaseEmailVerified,
        message: 'Verification status already in sync',
        wasUpdated: false
      };
    } catch (error) {
      console.error('Sync verification status error:', error);
      throw new BadRequestException('Failed to sync verification status');
    }
  }
}
