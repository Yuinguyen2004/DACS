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
import { Quiz } from '../quizzes/quiz.schema';
import { TestAttempt } from '../test-attempts/test-attempt.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(TestAttempt.name) private testAttemptModel: Model<TestAttempt>,
  ) { }

  async create(dto: CreateUserDto) {
    // check email hien da ton tai
    const emailExists = await this.userModel.findOne({ email: dto.email });
    if (emailExists) {
      throw new BadRequestException('Email already exists');
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
      avatar: dto.avatar, // add avatar support
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

  async findByIdWithPackage(id: string) {
    return this.userModel.findById(id).populate('package_id');
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
    if (!user.password_hash) {
      throw new BadRequestException('User does not have a password set');
    }
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password_hash);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');
    user.password_hash = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  async updateUserPackage(
    userId: string,
    packageId: string,
    subscriptionType: string,
    subscriptionStartDate: Date,
    subscriptionEndDate?: Date,
  ) {
    const updateData: any = {
      package_id: packageId,
      subscriptionType,
      subscriptionStartDate,
      status: 'active', // Activate user after successful payment
    };

    if (subscriptionEndDate) {
      updateData.subscriptionEndDate = subscriptionEndDate;
    }

    const user = await this.userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async cancelSubscription(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Chỉ cho phép hủy subscription nếu user đang có subscription active
    if (
      !user.package_id ||
      user.package_id.toString() === 'guest' ||
      user.status !== 'active'
    ) {
      throw new BadRequestException('No active subscription to cancel');
    }

    // Reset về package guest và xóa hoàn toàn các thông tin subscription
    const updateData = {
      package_id: 'guest',
      $unset: {
        subscriptionType: 1,
        subscriptionStartDate: 1,
        subscriptionEndDate: 1,
      },
      status: 'inactive',
    };

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  // Firebase-specific methods
  async createFromFirebase(firebaseData: {
    email: string;
    firebaseUid: string;
    displayName?: string;
    emailVerified?: boolean;
    photoURL?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: firebaseData.email },
        { firebaseUid: firebaseData.firebaseUid },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Create username from email or displayName
    let username = firebaseData.displayName || firebaseData.email.split('@')[0];

    // Ensure username is unique
    const usernameExists = await this.userModel.findOne({ username });
    if (usernameExists) {
      username = `${username}_${Date.now()}`;
    }

    const user = new this.userModel({
      name: firebaseData.displayName || firebaseData.email.split('@')[0],
      username,
      email: firebaseData.email,
      firebaseUid: firebaseData.firebaseUid,
      displayName: firebaseData.displayName,
      emailVerified: firebaseData.emailVerified,
      photoURL: firebaseData.photoURL,
      role: 'user',
      package_id: 'guest',
      status: firebaseData.emailVerified ? 'active' : 'inactive',
    });

    await user.save();
    return user;
  }

  // New method to create user with both Firebase data and password hash
  async createWithFirebase(userData: {
    email: string;
    password: string;
    name: string;
    username?: string;
    firebaseUid: string;
    displayName?: string;
    emailVerified?: boolean;
  }) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: userData.email },
        { firebaseUid: userData.firebaseUid },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Create username from provided or generate from email/name
    let username = userData.username || userData.name || userData.email.split('@')[0];

    // Ensure username is unique
    const usernameExists = await this.userModel.findOne({ username });
    if (usernameExists) {
      username = `${username}_${Date.now()}`;
    }

    // Hash the password
    const password_hash = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      name: userData.name,
      username,
      email: userData.email,
      password_hash,
      firebaseUid: userData.firebaseUid,
      displayName: userData.displayName || userData.name,
      emailVerified: userData.emailVerified || false,
      role: 'user',
      package_id: 'guest',
      status: userData.emailVerified ? 'active' : 'inactive',
    });

    await user.save();
    return user;
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.userModel.findOne({ firebaseUid });
  }

  async updateFirebaseUid(userId: string, firebaseUid: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { firebaseUid },
      { new: true },
    );
  }

  async updatePhotoURL(userId: string, photoURL: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { photoURL },
      { new: true },
    );
  }

  async linkFirebaseAccount(userId: string, firebaseUid: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if Firebase UID is already linked to another user
    const existingFirebaseUser = await this.userModel.findOne({ firebaseUid });
    if (
      existingFirebaseUser &&
      existingFirebaseUser._id.toString() !== userId
    ) {
      throw new BadRequestException(
        'Firebase account already linked to another user',
      );
    }

    user.firebaseUid = firebaseUid;
    await user.save();

    const { password_hash, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  /**
   * Set user online status
   */
  async setUserOnline(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });
  }

  /**
   * Set user offline status
   */
  async setUserOffline(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date(),
    });
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
    });
  }

  /**
   * Updates user's email verification status in the database
   * @param userId - User's MongoDB ObjectId
   * @param emailVerified - Verification status (true/false)
   */
  async updateFirebaseVerificationStatus(userId: string, emailVerified: boolean) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { emailVerified },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===== ADMIN METHODS =====

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats() {
    const [totalUsers, totalAdmins, onlineUsers, premiumUsers, totalQuizzes, totalAttempts] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: 'admin' }),
      this.userModel.countDocuments({ isOnline: true }),
      this.userModel.countDocuments({
        $and: [
          { package_id: { $ne: 'guest' } },
          { package_id: { $exists: true } },
          { package_id: { $ne: null } }
        ]
      }),
      this.quizModel.countDocuments(),
      this.testAttemptModel.countDocuments(),
    ]);

    return {
      totalUsers,
      totalAdmins,
      onlineUsers,
      premiumUsers,
      totalQuizzes,
      totalAttempts,
    };
  }

  /**
   * Get all users with filtering for admin dashboard
   */
  async getAllUsersForAdmin(filters: {
    search?: string;
    role?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const query: any = {};

    // Search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { username: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      query.role = filters.role;
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query, '-password_hash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        isPremium: user.package_id &&
          typeof user.package_id === 'string' ? false :
          typeof user.package_id === 'object' &&
          user.package_id !== null
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * Admin update user role and status
   */
  async adminUpdateUser(userId: string, updateData: { role?: string; status?: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate role
    if (updateData.role && !['user', 'admin'].includes(updateData.role)) {
      throw new BadRequestException('Invalid role. Must be: user or admin');
    }

    // Validate status
    if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
      throw new BadRequestException('Invalid status. Must be: active or inactive');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password_hash' }
    );

    return updatedUser;
  }

  /**
   * Admin delete user
   */
  async adminDeleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.userModel.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
}
