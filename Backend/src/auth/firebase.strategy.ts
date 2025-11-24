import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { FirebaseConfigService } from './firebase.config';
import { UsersService } from '../users/user.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(CustomStrategy, 'firebase') {
  constructor(
    private firebaseConfig: FirebaseConfigService,
    private usersService: UsersService,
  ) {
    super();
  }

  async validate(req: any, done: any): Promise<any> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return done(new UnauthorizedException('No valid authorization token found'), false);
      }

      const token = authHeader.replace('Bearer ', '');
      
      let decodedToken;
      let user;

      try {
        // First try to verify as ID token (for direct Firebase client tokens)
        decodedToken = await this.firebaseConfig.verifyIdToken(token);
        
        if (!decodedToken.uid || !decodedToken.email) {
          return done(new UnauthorizedException('Invalid token payload'), false);
        }

        // Find or create user in your database
        user = await this.usersService.findByEmail(decodedToken.email);
        
      } catch (idTokenError) {
        // Reject all non-ID tokens - no fallback to custom tokens
        console.error('Firebase ID token verification failed:', idTokenError.message);
        
        // Force user to re-authenticate with fresh Firebase ID token
        return done(
          new UnauthorizedException('Your session has expired. Please logout and login again to continue.'),
          false
        );
      }

      // Find user if not already found (only for ID token flow)
      if (!user && decodedToken.email) {
        user = await this.usersService.findByEmail(decodedToken.email);
      }
      
      if (!user) {
        // Auto-create user if not exists (optional - you might want to require manual registration)
        console.log(
          'Creating new user from Firebase token:',
          decodedToken.email,
        );
        user = await this.usersService.createFromFirebase({
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          displayName: decodedToken.name || '',
          emailVerified: decodedToken.email_verified || false,
        });
      } else {
        // Update Firebase UID if not set
        if (!user.firebaseUid) {
          await this.usersService.updateFirebaseUid(
            user._id.toString(),
            decodedToken.uid,
          );
          user.firebaseUid = decodedToken.uid;
        }
      }

      if (!user) {
        return done(new UnauthorizedException('Failed to create or find user'), false);
      }

      // Check if user is blocked (status: 'inactive')
      if (user.status === 'inactive') {
        return done(
          new UnauthorizedException('Your account has been blocked by an administrator. Please contact support.'), 
          false
        );
      }

      // Return success with user data
      // Set user as online
      await this.usersService.setUserOnline(user._id.toString());

      const userData = {
        userId: user._id,
        email: user.email,
        role: user.role || 'user',
        firebaseUid: decodedToken.uid,
        firebaseToken: decodedToken,
      };

      return done(null, userData);

    } catch (error) {
      console.error('Firebase token validation failed:', error);
      return done(new UnauthorizedException('Invalid Firebase token'), false);
    }
  }
}
