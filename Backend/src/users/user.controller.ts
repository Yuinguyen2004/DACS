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
  constructor(private readonly usersService: UsersService) {}

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
    const hasPremiumPackage =
      user.package_id &&
      (typeof user.package_id === 'object' || user.package_id !== 'guest');

    const isActive = user.status === 'active';
    const subscriptionEndDate = user.subscriptionEndDate;
    const isSubscriptionValid = subscriptionEndDate
      ? new Date() < new Date(subscriptionEndDate)
      : false;

    return {
      isAdmin,
      hasPremiumPackage,
      isActive,
      subscriptionType: user.subscriptionType,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      isSubscriptionValid,
      canAccessPremium:
        isAdmin || (hasPremiumPackage && isActive && isSubscriptionValid),
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/password')
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ) {
    if (req.user.userId !== id) {
      throw new NotFoundException('You can only change your own password');
    }
    return this.usersService.changePassword(id, dto);
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
