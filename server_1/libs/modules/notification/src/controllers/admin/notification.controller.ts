import { Body, Controller, Get, Param, Post, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { NotificationService } from '../../services/notification.service';
import { LogService } from '../../services/log.service';
import { SendNotificationDto } from '../../dto/send-notification.dto';
import { RetryNotificationDto } from '../../dto/retry-notification.dto';

@Controller('admin/notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logService: LogService,
  ) {}

  /**
   * Send notification
   * POST /api/v1/admin/notification/send
   */
  @Post('send')
  async sendNotification(
    @Body() body: SendNotificationDto,
  ): Promise<{ messageId: string; success: boolean; message: string }> {
    const result = await this.notificationService.send(body);
    return {
      ...result,
      message: 'Notification sent successfully',
    };
  }

  /**
   * Retry failed notification
   * POST /api/v1/admin/notification/:id/retry
   */
  @Post(':id/retry')
  async retryNotification(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ messageId: string; success: boolean; message: string }> {
    const result = await this.notificationService.retry(id);
    return {
      ...result,
      message: 'Notification retried successfully',
    };
  }

  /**
   * Get notifications by member ID
   * GET /api/v1/admin/notification/member/:memberId
   */
  @Get('member/:memberId')
  async getNotificationsByMember(
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    const logs = await this.logService.findByMember(memberId);
    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * Get notification by ID
   * GET /api/v1/admin/notification/:id
   */
  @Get(':id')
  async getNotificationById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const log = await this.logService.findById(id);
    if (!log) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }
    return {
      success: true,
      data: log,
    };
  }
}
