import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@server_1/core';
import * as nodemailer from 'nodemailer';
import { SendNotificationDto } from '../../dto';
import { ConfigParam } from 'eatfit247-shared-library';

export interface EmailProviderResult {
  messageId: string;
  rawResponse: any;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly appConfigService: AppConfigService) {}

  /**
   * Initialize email transporter from config
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const smtpHost = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_HOST);
    const smtpPort = this.appConfigService.getNumber(ConfigParam.SYSTEM_EMAIL_PORT) || 587;
    const smtpSecure = this.appConfigService.getBoolean(ConfigParam.SYSTEM_EMAIL_SECURE) || false;
    const smtpUser = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_USER);
    const smtpPassword = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_PASSWORD);

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error('SMTP configuration is incomplete. Please check SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Verify connection
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error: any) {
      this.logger.error(`SMTP verification failed: ${error.message}`, error.stack);
      throw new Error(`SMTP connection failed: ${error.message}`);
    }

    return this.transporter;
  }

  /**
   * Send email notification
   * @param dto - Notification DTO
   * @returns Result with message ID and raw response
   */
  async send(dto: SendNotificationDto): Promise<EmailProviderResult> {
    try {
      const transporter = await this.getTransporter();
      const smtpFrom =
        this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_USER);

      const mailOptions: nodemailer.SendMailOptions = {
        from: smtpFrom,
        to: dto.recipient,
        subject: dto.subject || 'Notification',
        text: dto.message,
        html: dto.message, // Use message as HTML, or you can have separate html field
      };

      this.logger.log(`Sending email to ${dto.recipient}`);

      const info = await transporter.sendMail(mailOptions);

      const messageId = info.messageId || `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.logger.log(`Email sent successfully. Message ID: ${messageId}`);

      return {
        messageId,
        rawResponse: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

