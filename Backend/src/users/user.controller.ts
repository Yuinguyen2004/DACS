// users.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UsePipes,
  ValidationPipe,
  Param,
  NotFoundException,
  BadRequestException,
  Patch,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/user-dto/create-user.dto';
import { UpdateUserDto } from './dto/user-dto/update-user.dto';
import { ChangePasswordDto } from './dto/user-dto/change-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get admin dashboard statistics - only for admin users
   */
  @Get('admin/stats')
  @UseGuards(FirebaseAuthGuard)
  async getAdminStats(@Req() req: any) {
    await this.checkAdminAccess(req.user.userId);
    return this.usersService.getAdminStats();
  }

  /**
   * Get all users with filtering - only for admin users
   */
  @Get('admin/users')
  @UseGuards(FirebaseAuthGuard)
  async getAllUsersForAdmin(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.checkAdminAccess(req.user.userId);

    const filters = {
      search,
      role,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    return this.usersService.getAllUsersForAdmin(filters);
  }

  /**
   * Update user role and status - only for admin users
   */
  @Patch('admin/:userId')
  @UseGuards(FirebaseAuthGuard)
  async adminUpdateUser(
    @Param('userId') userId: string,
    @Body() updateData: { role?: string; status?: string },
    @Req() req: any,
  ) {
    await this.checkAdminAccess(req.user.userId);
    return this.usersService.adminUpdateUser(userId, updateData);
  }

  /**
   * Delete user - only for admin users
   */
  @Delete('admin/:userId')
  @UseGuards(FirebaseAuthGuard)
  async adminDeleteUser(@Param('userId') userId: string, @Req() req: any) {
    await this.checkAdminAccess(req.user.userId);
    return this.usersService.adminDeleteUser(userId);
  }

  // ===== REGULAR USER ENDPOINTS =====

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  async findAll() {
    return (await this.usersService.findAll()).map((u) => {
      const { password_hash, ...userWithoutPassword } = u.toObject();
      return userWithoutPassword;
    });
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Req() req: any) {
    // This endpoint is needed because the frontend might be calling /users/profile
    // and falling through to the :id route, causing a CastError.
    const userId = req.user.userId;
    const user = await this.usersService.findByIdWithPackage(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password_hash, ...result } = user.toObject();

    // Add isPremium flag based on package_id
    // Premium if package exists, is an object (populated), and price > 0
    const packageData = result.package_id as any;
    const isPremium =
      packageData &&
      typeof packageData === 'object' &&
      packageData.price > 0;

    return {
      ...result,
      isPremium,
      subscriptionType: result.subscriptionType || null,
      subscriptionStartDate: result.subscriptionStartDate || null,
      subscriptionEndDate: result.subscriptionEndDate || null,
      subscriptionCanceledAt: result.subscriptionCanceledAt || null,
    };
  }

  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(@Req() req: any, @Body() updateData: { name?: string }) {
    const userId = req.user.userId;
    let user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user name if provided
    if (updateData.name) {
      user.name = updateData.name;
      await user.save();
    }

    // Re-fetch with package to ensure correct premium status
    user = await this.usersService.findByIdWithPackage(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password_hash, ...result } = user.toObject();

    // Add isPremium flag
    const packageData = result.package_id as any;
    const isPremium =
      packageData &&
      typeof packageData === 'object' &&
      packageData.price > 0;

    return {
      ...result,
      isPremium,
    };
  }

  @Patch('change-password')
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @Req() req: any,
    @Body() passwordData: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(
      passwordData.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { password_hash, ...rest } = user.toObject();
    return rest;
  }

  /**
   * Kiểm tra trạng thái subscription của user hiện tại
   */
  @Get('subscription-status')
  @UseGuards(FirebaseAuthGuard)
  async getSubscriptionStatus(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === 'admin';
    // User has premium if package_id exists and is not null
    const hasPremiumPackage = !!user.package_id;

    const isActive = user.status === 'active';
    const subscriptionEndDate = user.subscriptionEndDate;
    const isSubscriptionValid = subscriptionEndDate
      ? new Date() < new Date(subscriptionEndDate)
      : false;

    const isCanceled = !!user.subscriptionCanceledAt;

    return {
      isAdmin,
      hasPremiumPackage,
      isActive,
      subscriptionType: user.subscriptionType,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionCanceledAt: user.subscriptionCanceledAt || null,
      isCanceled,
      isSubscriptionValid,
      canAccessPremium:
        isAdmin || (hasPremiumPackage && isActive && isSubscriptionValid),
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }



  @Delete('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  async cancelSubscription(
    @Req()
    request: Request & {
      user: { userId: string; email: string; role: string };
    },
  ) {
    try {
      const userId = request.user.userId;

      const updatedUser = await this.usersService.cancelSubscription(userId);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          package_id: updatedUser.package_id,
          status: updatedUser.status,
          subscriptionType: updatedUser.subscriptionType,
          subscriptionEndDate: updatedUser.subscriptionEndDate,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Helper method to check if user has admin access
   */
  private async checkAdminAccess(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Access denied. Admin role required.');
    }

    return user;
  }
}
