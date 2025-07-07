// users.controller.ts
import { Controller, Post, Get, Body } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body) {
    return this.usersService.create(body);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}
