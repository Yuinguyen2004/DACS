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
        // If ID token verification fails, try custom token validation
        console.log('ID token verification failed, trying custom token validation:', idTokenError.message);
        
        try {
          // Custom tokens are JWTs signed by our server, so we can decode them
          // Parse the JWT payload to extract user information
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          
          // Verify this is our custom token by checking the structure
          if (!payload.uid || !payload.claims || !payload.claims.userId) {
            throw new Error('Invalid custom token payload');
          }
          
          // Extract user info from custom token claims
          const userId = payload.claims.userId;
          const firebaseUid = payload.uid;
          
          // Find user by ID
          user = await this.usersService.findById(userId);
          
          if (!user) {
            throw new Error('User not found for custom token');
          }
          
          // Verify the Firebase UID matches
          if (user.firebaseUid !== firebaseUid) {
            throw new Error('Firebase UID mismatch');
          }
          
          // Create a decodedToken-like object for consistency
          decodedToken = {
            uid: firebaseUid,
            email: user.email,
            role: payload.claims.role || user.role,
            userId: userId
          };
          
        } catch (customTokenError) {
          console.error('Both ID token and custom token validation failed:', {
            idTokenError: idTokenError.message,
            customTokenError: customTokenError.message
          });
          return done(new UnauthorizedException('Invalid Firebase token'), false);
        }
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
