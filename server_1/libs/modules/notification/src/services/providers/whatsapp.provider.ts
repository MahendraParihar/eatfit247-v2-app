import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppConfigService } from '@server_1/core';
import { firstValueFrom } from 'rxjs';
import { SendNotificationDto } from '../../dto/send-notification.dto';
import { ConfigParam } from 'eatfit247-shared-library';

export interface WhatsAppProviderResult {
  messageId: string;
  rawResponse: any;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly appConfigService: AppConfigService,
  ) {}

  /**
   * Get WhatsApp API URL from config
   */
  private getApiUrl(): string {
    return this.appConfigService.getString(ConfigParam.WHATSAPP_API_URL) || 'https://graph.facebook.com/v18.0';
  }

  /**
   * Get WhatsApp access token from config
   */
  private getAccessToken(): string {
    const token = this.appConfigService.getString(ConfigParam.WHATSAPP_API_TOKEN);
    if (!token) {
      throw new Error('WHATSAPP_API_TOKEN is not configured');
    }
    return token;
  }

  /**
   * Get WhatsApp phone number ID from config
   */
  private getPhoneNumberId(): string {
    const phoneNumberId = this.appConfigService.getString(ConfigParam.WHATSAPP_PHONE_NUMBER_ID);
    if (!phoneNumberId) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured');
    }
    return phoneNumberId;
  }

  /**
   * Format phone number to international format
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
   * Send WhatsApp template message
   * @param dto - Notification DTO
   * @returns Result with message ID and raw response
   */
  async send(dto: SendNotificationDto): Promise<WhatsAppProviderResult> {
    try {
      const apiUrl = this.getApiUrl();
      const phoneNumberId = this.getPhoneNumberId();
      const accessToken = this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(dto.recipient);

      const url = `${apiUrl}/${phoneNumberId}/messages`;

      let payload: any;

      if (dto.templateName) {
        // Template-based message
        payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
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
      } else {
        // Text message
        payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: dto.message || '',
          },
        };
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      this.logger.log(`Sending WhatsApp message to ${formattedPhone}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers }),
      );

      const messageId = response.data?.messages?.[0]?.id;

      if (!messageId) {
        throw new Error('No message ID in WhatsApp API response');
      }

      this.logger.log(`WhatsApp message sent successfully. Message ID: ${messageId}`);

      return {
        messageId,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Error sending WhatsApp message: ${error.message}`, error.stack);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}

