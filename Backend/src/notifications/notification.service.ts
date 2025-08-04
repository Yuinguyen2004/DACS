import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Notification } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SystemNotificationDto } from './dto/system-notification.dto';

@Injectable()
export class NotificationService {
  private notificationGateway: any; // Will be injected via setter to avoid circular dependency

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  // Setter for gateway to avoid circular dependency
  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      // Validate userId format
      if (!Types.ObjectId.isValid(dto.userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const notification = new this.notificationModel({
        ...dto,
        userId: new Types.ObjectId(dto.userId),
      });
      const savedNotification = await notification.save();

      // Send real-time notification
      if (this.notificationGateway) {
        await this.notificationGateway.sendNotificationToUser(dto.userId, {
          _id: savedNotification._id,
          title: savedNotification.title,
          content: savedNotification.content,
          type: savedNotification.type,
          data: savedNotification.data,
          isRead: savedNotification.isRead,
          createdAt: (savedNotification as any).createdAt,
        });
      }

      return savedNotification;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create notification');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find()
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments(),
      ]);

      return {
        notifications,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch notifications');
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid notification ID format');
      }

      const notification = await this.notificationModel
        .findById(id)
        .populate('userId', 'name email')
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch notification');
    }
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const skip = (page - 1) * limit;
      const userObjectId = new Types.ObjectId(userId);

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments({ userId: userObjectId }),
      ]);

      return {
        notifications,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user notifications');
    }
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      return await this.notificationModel
        .find({
          userId: new Types.ObjectId(userId),
          isRead: false,
        })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch unread notifications');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      return await this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get unread count');
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid notification ID format');
      }

      const notification = await this.notificationModel
        .findByIdAndUpdate(id, { isRead: true }, { new: true })
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  async markAllAsReadForUser(
    userId: string,
  ): Promise<{ modifiedCount: number }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const result = await this.notificationModel
        .updateMany(
          { userId: new Types.ObjectId(userId), isRead: false },
          { isRead: true },
        )
        .exec();

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to mark all notifications as read');
    }
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid notification ID format');
      }

      const notification = await this.notificationModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }
      return notification;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update notification');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid notification ID format');
      }

      const result = await this.notificationModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('Notification not found');
      }
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete notification');
    }
  }

  async removeAllForUser(userId: string): Promise<{ deletedCount: number }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const result = await this.notificationModel
        .deleteMany({ userId: new Types.ObjectId(userId) })
        .exec();

      return { deletedCount: result.deletedCount };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete user notifications');
    }
  }

  // Admin-only methods
  async broadcastNotification(
    dto: BroadcastNotificationDto,
  ): Promise<{ createdCount: number }> {
    try {
      let targetUserIds: Types.ObjectId[] = [];

      if (dto.userIds && dto.userIds.length > 0) {
        // Broadcast to specific users
        for (const userId of dto.userIds) {
          if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException(`Invalid user ID format: ${userId}`);
          }
          targetUserIds.push(new Types.ObjectId(userId));
        }
      } else {
        // Broadcast to all users - get all user IDs from User collection
        const allUsers = await this.userModel
          .find({ status: { $ne: 'deleted' } }, '_id')
          .exec();
        targetUserIds = allUsers.map((user) => user._id);

        if (targetUserIds.length === 0) {
          throw new BadRequestException(
            'No active users found for broadcasting',
          );
        }
      }

      const notifications = targetUserIds.map((userId) => ({
        userId,
        title: dto.title,
        content: dto.content,
        type: dto.type,
        data: dto.data,
        isRead: false,
      }));

      const result = await this.notificationModel.insertMany(notifications);

      // Send real-time notifications to all target users
      if (this.notificationGateway) {
        for (const savedNotification of result) {
          await this.notificationGateway.sendNotificationToUser(
            savedNotification.userId.toString(),
            {
              _id: savedNotification._id,
              title: savedNotification.title,
              content: savedNotification.content,
              type: savedNotification.type,
              data: savedNotification.data,
              isRead: savedNotification.isRead,
              createdAt: (savedNotification as any).createdAt,
            },
          );
        }
      }

      return { createdCount: result.length };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to broadcast notification');
    }
  }

  async createSystemNotification(
    dto: SystemNotificationDto,
  ): Promise<{ message: string; totalUsers: number }> {
    try {
      // Get all active users
      const allUsers = await this.userModel
        .find({ status: { $ne: 'deleted' } }, '_id')
        .exec();

      if (allUsers.length === 0) {
        throw new BadRequestException(
          'No active users found for system notification',
        );
      }

      const notifications = allUsers.map((user) => ({
        userId: user._id,
        title: dto.title,
        content: dto.content,
        type: 'system',
        data: dto.data || {},
        isRead: false,
      }));

      const result = await this.notificationModel.insertMany(notifications);

      // Send real-time system notification to all users
      if (this.notificationGateway) {
        const systemNotificationData = {
          title: dto.title,
          content: dto.content,
          type: 'system',
          data: dto.data || {},
          isRead: false,
          createdAt: new Date(),
        };
        await this.notificationGateway.broadcastNotification(
          systemNotificationData,
        );
      }

      return {
        message: 'System notification sent successfully',
        totalUsers: result.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create system notification');
    }
  }

  async findAllWithFilters(
    page: number = 1,
    limit: number = 10,
    userId?: string,
    type?: string,
    isRead?: boolean,
  ): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const filter: any = {};

      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID format');
        }
        filter.userId = new Types.ObjectId(userId);
      }

      if (type) {
        filter.type = type;
      }

      if (isRead !== undefined) {
        filter.isRead = isRead;
      }

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find(filter)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments(filter),
      ]);

      return {
        notifications,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch notifications with filters',
      );
    }
  }

  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: { type: string; count: number }[];
  }> {
    try {
      const [total, unread, byType] = await Promise.all([
        this.notificationModel.countDocuments(),
        this.notificationModel.countDocuments({ isRead: false }),
        this.notificationModel.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $project: { type: '$_id', count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ]),
      ]);

      return {
        total,
        unread,
        byType,
      };
    } catch (error) {
      throw new BadRequestException('Failed to get notification statistics');
    }
  }

  // User permission checking methods
  async verifyNotificationOwnership(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(notificationId) ||
        !Types.ObjectId.isValid(userId)
      ) {
        return false;
      }

      const notification = await this.notificationModel.findOne({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      });

      return notification !== null;
    } catch (error) {
      return false;
    }
  }
}
