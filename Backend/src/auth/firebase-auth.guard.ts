import { Injectable, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';

// Decorator to allow inactive users (e.g., for payment endpoints)
export const AllowInactiveUser = () => SetMetadata('allowInactiveUser', true);

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase') {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let passport authenticate the token
    const canActivate = await super.canActivate(context);
    
    if (!canActivate) {
      return false;
    }

    // Check if this endpoint allows inactive users
    const allowInactiveUser = this.reflector.get<boolean>('allowInactiveUser', context.getHandler());

    // After successful token validation, check if user is blocked
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (userId) {
      // Fetch fresh user data from database to check current status
      const user = await this.userModel.findById(userId).exec();
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is blocked (status: 'inactive')
      // Allow inactive users for payment endpoints (they get activated after payment)
      if (user.status === 'inactive' && !allowInactiveUser) {
        throw new UnauthorizedException('Your account has been blocked by an administrator. Please contact support.');
      }

      // Update user object with fresh role in case it changed
      request.user.role = user.role;
      request.user.status = user.status;
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
