import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService, Public } from '@server_1/core';
import { LogService } from '../services';

@Public()
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly logService: LogService,
    private readonly appConfigService: AppConfigService,
  ) {}

  /**
   * Webhook verification endpoint (GET)
   * WhatsApp requires this for webhook verification
   * GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): Promise<string> {
    this.logger.log(`Webhook verification request: mode=${mode}, token=[REDACTED]`);

    const verifyToken = this.appConfigService.getString('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verification successful');
      return challenge;
    }

    this.logger.warn('Invalid webhook verification token');
    throw new UnauthorizedException('Invalid verification token');
  }

  /**
   * Webhook endpoint for receiving WhatsApp status updates (POST)
   * POST /api/v1/webhooks/whatsapp
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Body() body: any): Promise<{ status: string }> {
    this.logger.log('Received WhatsApp webhook');
    try {
      if (body.object === 'whatsapp_business_account') {
        body.entry?.forEach((entry: any) => {
          entry.changes?.forEach((change: any) => {
            if (change.field === 'messages') {
              const value = change.value;

              // Handle status updates
              if (value.statuses) {
                value.statuses.forEach((status: any) => {
                  const messageId = status.id;
                  const statusValue = status.status.toLowerCase(); // sent, delivered, read, failed

                  this.logger.log(`Message status update: ${statusValue} for ID: ${messageId}`);

                  // Map WhatsApp status to our status
                  let mappedStatus = 'sent';
                  if (statusValue === 'delivered') {
                    mappedStatus = 'delivered';
                  } else if (statusValue === 'read') {
                    mappedStatus = 'delivered'; // We can use 'delivered' for read, or add a new status
                  } else if (statusValue === 'failed') {
                    mappedStatus = 'failed';
                  }

                  // Update notification log
                  this.logService
                    .updateStatusByMessageId(messageId, mappedStatus)
                    .catch((error) => {
                      this.logger.error(
                        `Error updating status for message ${messageId}: ${error.message}`,
                      );
                    });
                });
              }

              if (value.messages) {
                value.messages.forEach((message: any) => {
                  this.logger.log(
                    `Received incoming WhatsApp message, type: ${message.type}`,
                  );
                });
              }
            }
          });
        });
      }

      return { status: 'success' };
    } catch (error: any) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { status: 'error' };
    }
  }
}
