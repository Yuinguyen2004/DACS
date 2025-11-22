import { Injectable } from '@nestjs/common';

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
  /**
   * Ghi log thao tác admin
   */
  async logAdminAction(entry: AuditLogEntry): Promise<void> {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
    };

    // Log to console (trong production có thể log vào file hoặc database)
    console.log('=== ADMIN AUDIT LOG ===');
    console.log(`Timestamp: ${logEntry.timestamp.toISOString()}`);
    console.log(`Admin: ${logEntry.adminEmail} (${logEntry.adminId})`);
    console.log(`Action: ${logEntry.action} ${logEntry.resource}`);
    console.log(`Resource ID: ${logEntry.resourceId}`);

    if (logEntry.changes) {
      console.log('Changes:', JSON.stringify(logEntry.changes, null, 2));
    }

    if (logEntry.reason) {
      console.log(`Reason: ${logEntry.reason}`);
    }

    if (logEntry.ipAddress) {
      console.log(`IP Address: ${logEntry.ipAddress}`);
    }

    if (logEntry.userAgent) {
      console.log(`User Agent: ${logEntry.userAgent}`);
    }

    console.log('========================');

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
