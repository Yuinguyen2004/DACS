import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  timestamp: Date;
  adminId: string;
  adminEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'LEADERBOARD';
  resourceId: string;
  changes?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service xử lý audit logging cho các thao tác admin
 * Ghi lại tất cả thay đổi quan trọng cho mục đích bảo mật và giám sát
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  /**
   * Ghi log thao tác admin
   */
  async logAdminAction(entry: AuditLogEntry): Promise<void> {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
    };

    // Log admin action
    this.logger.log(`Admin action: ${logEntry.action} ${logEntry.resource} by ${logEntry.adminEmail}`);

    // Trong production, có thể lưu vào database hoặc external logging service
    // await this.saveToDatabase(logEntry);
    // await this.sendToLoggingService(logEntry);
  }

  /**
   * Ghi log tạo mới entry leaderboard bởi admin
   */
  async logLeaderboardCreate(
    adminId: string,
    adminEmail: string,
    leaderboardId: string,
    leaderboardData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAdminAction({
      timestamp: new Date(),
      adminId,
      adminEmail,
      action: 'CREATE',
      resource: 'LEADERBOARD',
      resourceId: leaderboardId,
      changes: { created: leaderboardData },
      reason: 'Admin manual creation',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Ghi log cập nhật entry leaderboard bởi admin
   */
  async logLeaderboardUpdate(
    adminId: string,
    adminEmail: string,
    leaderboardId: string,
    oldData: any,
    newData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAdminAction({
      timestamp: new Date(),
      adminId,
      adminEmail,
      action: 'UPDATE',
      resource: 'LEADERBOARD',
      resourceId: leaderboardId,
      changes: {
        before: oldData,
        after: newData,
      },
      reason: 'Admin manual update',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Ghi log xóa entry leaderboard bởi admin
   */
  async logLeaderboardDelete(
    adminId: string,
    adminEmail: string,
    leaderboardId: string,
    deletedData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAdminAction({
      timestamp: new Date(),
      adminId,
      adminEmail,
      action: 'DELETE',
      resource: 'LEADERBOARD',
      resourceId: leaderboardId,
      changes: { deleted: deletedData },
      reason: 'Admin manual deletion',
      ipAddress,
      userAgent,
    });
  }
}
