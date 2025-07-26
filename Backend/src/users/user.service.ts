// users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { CreateUserDto } from './dto/user-dto/create-user.dto';
import { UpdateUserDto } from './dto/user-dto/update-user.dto';
import { ChangePasswordDto } from './dto/user-dto/change-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(dto: CreateUserDto) {
    // check email hien da ton tai
    const emailExists = await this.userModel.findOne({ email: dto.email });
    if (emailExists) {
      throw new Error('Email already exists');
    }

    // hash password
    const hash = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email,
      password_hash: hash,
      role: 'user', // default role
      package_id: null, // reference to Packages collection, default to null until assigned
      status: 'inactive', // default status
    });
    await user.save();
    const { password_hash, ...userWithoutPassword } = user.toObject(); // khong tra ve mat khau
    return userWithoutPassword;
  }

  async findAll() {
    return this.userModel.find();
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash, ...rest } = user.toObject();
    return rest;
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password_hash);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');
    user.password_hash = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }
}
