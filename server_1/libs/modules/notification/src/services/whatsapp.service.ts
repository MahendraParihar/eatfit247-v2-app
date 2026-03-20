import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SendNotificationDto } from '../dto';
import { ConfigParam } from 'eatfit247-shared-library';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>(ConfigParam.WHATSAPP_API_URL) || 'https://graph.facebook.com/v18.0';
    this.apiToken = this.configService.get<string>(ConfigParam.WHATSAPP_API_TOKEN) || '';
    this.phoneNumberId = this.configService.get<string>(ConfigParam.WHATSAPP_PHONE_NUMBER_ID) || '';
  }

  /**
   * Send a WhatsApp message
   * @param dto - Notification data
   * @returns Message ID if successful
   */
  async sendMessage(dto: SendNotificationDto): Promise<{ messageId: string; success: boolean }> {
    try {
      const phoneNumber = this.formatPhoneNumber(dto.recipient);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: dto.message || '',
        },
      };

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const headers = {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      };

      this.logger.log(`Sending WhatsApp message to ${phoneNumber}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );

      const messageId = response.data?.messages?.[0]?.id;

      if (messageId) {
        this.logger.log(`WhatsApp message sent successfully. Message ID: ${messageId}`);
        return { messageId, success: true };
      }

      throw new Error('Failed to send WhatsApp message: No message ID in response');
    } catch (error: any) {
      this.logger.error(`Error sending WhatsApp message: ${error.message}`, error.stack);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Send a WhatsApp message using a template
   * @param dto - Notification data with template information
   * @returns Message ID if successful
   */
  async sendTemplateMessage(dto: SendNotificationDto): Promise<{ messageId: string; success: boolean }> {
    try {
      if (!dto.templateName) {
        throw new Error('Template name is required for template messages');
      }

      const phoneNumber = this.formatPhoneNumber(dto.recipient);
      
      const payload: any = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: dto.templateName,
          language: {
            code: 'en',
          },
        },
      };

      // Add template parameters if provided
      if (dto.templateParams && Object.keys(dto.templateParams).length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: Object.entries(dto.templateParams).map(([key, value]) => ({
              type: 'text',
              text: String(value),
            })),
          },
        ];
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const headers = {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      };

      this.logger.log(`Sending WhatsApp template message to ${phoneNumber} using template: ${dto.templateName}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );

      const messageId = response.data?.messages?.[0]?.id;

      if (messageId) {
        this.logger.log(`WhatsApp template message sent successfully. Message ID: ${messageId}`);
        return { messageId, success: true };
      }

      throw new Error('Failed to send WhatsApp template message: No message ID in response');
    } catch (error: any) {
      this.logger.error(`Error sending WhatsApp template message: ${error.message}`, error.stack);
      throw new Error(`Failed to send WhatsApp template message: ${error.message}`);
    }
  }

  /**
   * Format phone number to international format
   * @param phoneNumber - Phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all spaces, dashes, and parentheses
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    // If it already starts with +, return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If it starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      return '+' + cleaned.substring(2);
    }

    // If it starts with 0, remove it and add +91 (India)
    if (cleaned.startsWith('0')) {
      return '+91' + cleaned.substring(1);
    }

    // Default to India (+91) if no country code
    return '+91' + cleaned;
  }

  /**
   * Verify WhatsApp webhook signature
   * @param signature - Webhook signature
   * @param payload - Webhook payload
   * @returns True if signature is valid
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    // Implement webhook signature verification if needed
    // This is a placeholder - implement based on WhatsApp Business API requirements
    return true;
  }
}

