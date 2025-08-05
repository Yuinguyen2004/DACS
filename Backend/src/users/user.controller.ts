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
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/user-dto/create-user.dto';
import { UpdateUserDto } from './dto/user-dto/update-user.dto';
import { ChangePasswordDto } from './dto/user-dto/change-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/password')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(JwtAuthGuard)
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
}
