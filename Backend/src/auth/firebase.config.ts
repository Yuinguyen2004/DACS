import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfigService {
  private readonly logger = new Logger(FirebaseConfigService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if using service account file path
      const serviceAccountPath = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      );

      if (serviceAccountPath) {
        // Initialize with service account file
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        });
      } else {
        // Initialize with environment variables
        const privateKey = this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n');

        if (!privateKey) {
          throw new Error(
            'Firebase private key not found in environment variables',
          );
        }

        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
            privateKey: privateKey,
            clientEmail: this.configService.get<string>(
              'FIREBASE_CLIENT_EMAIL',
            ),
          } as admin.ServiceAccount),
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        });
      }
    } catch (error) {
      this.logger.error('Firebase initialization error:', error);
      throw new Error(`Failed to initialize Firebase: ${error.message}`);
    }
  }

  getFirebaseApp(): admin.app.App {
    return this.app;
  }

  getAuth(): admin.auth.Auth {
    return this.app.auth();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  async createCustomToken(
    uid: string,
    additionalClaims?: object,
  ): Promise<string> {
    try {
      return await this.getAuth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      console.error('Custom token creation failed:', error);
      throw new Error('Failed to create custom token');
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    try {
      return await this.getAuth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    disabled?: boolean;
  }): Promise<admin.auth.UserRecord> {
    try {
      return await this.getAuth().createUser(userData);
    } catch (error) {
      console.error('User creation failed:', error);
      throw new Error('Failed to create Firebase user');
    }
  }

  async updateUser(
    uid: string,
    userData: admin.auth.UpdateRequest,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.getAuth().updateUser(uid, userData);
    } catch (error) {
      console.error('User update failed:', error);
      throw new Error('Failed to update Firebase user');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.getAuth().deleteUser(uid);
    } catch (error) {
      console.error('User deletion failed:', error);
      throw new Error('Failed to delete Firebase user');
    }
  }
}
