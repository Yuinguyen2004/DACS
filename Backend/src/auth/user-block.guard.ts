import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';

@Injectable()
export class UserBlockGuard {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const firebaseUser = request.user;

    if (!firebaseUser || !firebaseUser.userId) {
      return false;
    }

    // Get full user from database to check status
    const dbUser = await this.userModel.findOne({
      $or: [
        { firebaseUid: firebaseUser.uid },
        { email: firebaseUser.email },
        { _id: firebaseUser.userId }
      ]
    });

    if (!dbUser) {
      return false;
    }

    // Check if user is blocked (status: 'inactive')
    if (dbUser.status === 'inactive') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    // Attach full user data to request for later use
    request.user = {
      ...firebaseUser,
      userId: dbUser._id.toString(),
      role: dbUser.role,
      status: dbUser.status,
      emailVerified: dbUser.emailVerified || firebaseUser.emailVerified
    };

    console.log('[USER_BLOCK_GUARD] User access granted:', {
      userId: dbUser._id.toString(),
      role: dbUser.role,
      status: dbUser.status
    });

    return true;
  }
}