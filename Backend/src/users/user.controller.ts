// users.controller.ts
import { Controller, Post, Get, Body, UsePipes, ValidationPipe, Param, NotFoundException, Patch, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/user-dto/create-user.dto';
import { UpdateUserDto } from './dto/user-dto/update-user.dto';
import { ChangePasswordDto } from './dto/user-dto/change-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  async findAll() {
    return (await this.usersService.findAll()).map(u => {
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
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto, @Req() req: any) {
    if (req.user.userId !== id) {
      throw new NotFoundException('You can only change your own password');
    }
    return this.usersService.changePassword(id, dto);
  }
}
