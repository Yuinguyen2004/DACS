import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req, 
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SystemNotificationDto } from './dto/system-notification.dto';
import { Notification } from './notification.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ===========================================
  // ADMIN ONLY ENDPOINTS
  // ===========================================

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminCreateNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async broadcastNotification(
    @Body() broadcastDto: BroadcastNotificationDto,
  ): Promise<{ createdCount: number }> {
    return this.notificationService.broadcastNotification(broadcastDto);
  }

  @Post('admin/system')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createSystemNotification(
    @Body() systemDto: SystemNotificationDto,
  ): Promise<{ message: string, totalUsers: number }> {
    return this.notificationService.createSystemNotification(systemDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminFindAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool = isRead !== undefined ? isRead === 'true' : undefined;
    return this.notificationService.findAllWithFilters(page, limit, userId, type, isReadBool);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getNotificationStats() {
    return this.notificationService.getNotificationStats();
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminFindOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminUpdate(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.notificationService.remove(id);
  }

  @Delete('admin/user/:userId/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async adminRemoveAllForUser(@Param('userId') userId: string): Promise<{ deletedCount: number }> {
    return this.notificationService.removeAllForUser(userId);
  }

  // ===========================================
  // USER ENDPOINTS (own notifications only)
  // ===========================================

  @Get('my-notifications')
  async getMyNotifications(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.userId;
    return this.notificationService.findByUserId(userId, page, limit);
  }

  @Get('unread')
  async getUnreadNotifications(@Req() req: any): Promise<Notification[]> {
    const userId = req.user.userId;
    return this.notificationService.findUnreadByUserId(userId);
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: any): Promise<{ count: number }> {
    const userId = req.user.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any): Promise<Notification> {
    const userId = req.user.userId;
    
    // Verify ownership for non-admin users
    if (req.user.role !== 'admin') {
      const isOwner = await this.notificationService.verifyNotificationOwnership(id, userId);
      if (!isOwner) {
        throw new ForbiddenException('You can only access your own notifications');
      }
    }
    
    return this.notificationService.findOne(id);
  }

  @Patch(':id/mark-read')
  async markAsRead(@Param('id') id: string, @Req() req: any): Promise<Notification> {
    const userId = req.user.userId;
    
    // Verify ownership for non-admin users
    if (req.user.role !== 'admin') {
      const isOwner = await this.notificationService.verifyNotificationOwnership(id, userId);
      if (!isOwner) {
        throw new ForbiddenException('You can only mark your own notifications as read');
      }
    }
    
    return this.notificationService.markAsRead(id);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Req() req: any): Promise<{ modifiedCount: number }> {
    const userId = req.user.userId;
    return this.notificationService.markAllAsReadForUser(userId);
  }

  // Users cannot create, update, or delete notifications (except mark as read)
  // These endpoints are removed for regular users and only available to admin
}