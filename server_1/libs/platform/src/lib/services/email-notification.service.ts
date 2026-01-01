import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import * as ejs from 'ejs';
import { InjectModel } from '@nestjs/sequelize';
import { IEmailData, ISendEmailParams } from '@eatfit247-shared-lib';
import { AppConfigService } from '@server_1/core';
import { LogErrorService } from '../logging/log-error.service';
import { MstEmailTemplate } from '../database/models';

@Injectable()
export class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  private readonly serviceName = 'EmailNotificationService';
  private templatesPath: string;

  constructor(private readonly appConfigService: AppConfigService,
    private readonly logErrorService: LogErrorService,
    @InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate) {
    const distPath = path.join(__dirname, '../templates');
    const sourcePath = path.join(process.cwd(), 'libs/modules/email/src/templates');
    // Check if templates exist in the dist folder (production build)
    if (fs.existsSync(distPath)) {
      this.templatesPath = distPath;
    } else if (fs.existsSync(sourcePath)) {
      // Fallback to source folder (development)
      this.templatesPath = sourcePath;
    } else {
      this.templatesPath = distPath;
    }
    // Initialize email transporter
    const mailHost = this.appConfigService.getString('SYSTEM_EMAIL_HOST', true);
    const mailPort = this.appConfigService.getNumber('SYSTEM_EMAIL_PORT', true);
    const mailUser = this.appConfigService.getString('SYSTEM_EMAIL_USER', true);
    const mailPassword = this.appConfigService.getString('SYSTEM_EMAIL_PASSWORD', true);
    const enableMail = this.appConfigService.getBoolean('SYSTEM_EMAIL_ENABLE', true);
    if (!enableMail || !mailHost || !mailUser || !mailPassword) {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Use dummy transport for testing
      });
    } else {
      this.transporter = nodemailer.createTransport({
        pool: true,
        host: mailHost,
        secure: false,
        port: mailPort || 587,
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
        ignoreTLS: false,
        requireTLS: true,
      });
    }
  }

  public async sendEmail(params: ISendEmailParams): Promise<void> {
    try {
      // Get email template
      const template = await this.emailTemplateRepository.findOne({
        where: { emailTemplateId: params.emailTemplateId, active: true },
      });
      if (!template) {
        throw new NotFoundException('Email template not found or inactive');
      }
      // Use provided subject/body or template defaults
      let subject = params.subject || template.subject;
      let body = params.body || template.body;
      // Replace template variables if replacements provided
      if (params.replacements && subject && typeof subject === 'string' && body && typeof body === 'string') {
        Object.keys(params.replacements).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(params.replacements![key]));
          body = body.replace(regex, String(params.replacements![key]));
        });
      }
      // Prepare recipients
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      // Prepare attachments
      const attachments = params.attachments?.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
        contentType: att.contentType,
      })) || [];
      // Send email
      const mailOptions = {
        from: process.env['MAIL_USER'] || 'noreply@eatfit247.com',
        to: recipients.join(', '),
        subject: subject,
        html: body,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      await this.transporter.sendMail(mailOptions);
      // Log success (optional - you may want to remove this or make it configurable)
      // await this.logErrorService.logWarning(
      //   `Email sent successfully to ${recipients.join(', ')}. MessageId: ${result.messageId}`,
      //   { controller: this.serviceName, methodName: 'sendEmail' }
      // );
    } catch (error) {
      await this.logErrorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        { controller: this.serviceName, methodName: 'sendEmail' },
      );
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Generic email sending service using email type
   * Sends email using EJS templates with provided data
   * If template is not found (database or EJS), skips sending email
   *
   * @param emailData - Email data including type, recipient, and template variables
   * @returns Promise<void>
   */
  public async sendEmailByType(emailData: IEmailData): Promise<void> {
    try {
      const { to, subject, type, data, attachments } = emailData;
      const dbTemplate = await this.emailTemplateRepository.findOne({
        where: { templateName: type, active: true },
      });
      // If no database template found, skip email
      if (!dbTemplate) {
        await this.logErrorService.logWarning(
          `Email template not found for type ${type}. Skipping email send.`,
          { controller: this.serviceName, methodName: 'sendEmailByType' },
        );
        return;
      }
      let htmlBody = '';
      const finalSubject = subject || dbTemplate.subject;
      // Body contains EJS filename - load and render the EJS file
      const templateFile = path.join(this.templatesPath, `${dbTemplate.body}.ejs`);
      try {
        if (!fs.existsSync(templateFile)) {
          await this.logErrorService.logWarning(
            `EJS template file not found: ${templateFile}. Skipping email send.`,
            { controller: this.serviceName, methodName: 'sendEmailByType' },
          );
          return; // Skip email process if a template file not found
        }
        htmlBody = await this.renderTemplate(
          templateFile,
          data,
        );
      } catch (ejsError) {
        await this.logErrorService.logError(
          ejsError instanceof Error ? ejsError : new Error(String(ejsError)),
          { controller: this.serviceName, methodName: 'sendEmailByType' },
        );
        return; // Skip the email process if template rendering fails
      }
      // Prepare recipients
      const recipients = Array.isArray(to) ? to : [to];
      // Prepare attachments
      const emailAttachments = attachments?.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
        contentType: att.contentType,
      })) || [];
      // Send email
      const mailOptions = {
        from: process.env['MAIL_USER'] || 'noreply@eatfit247.com',
        to: recipients.join(', '),
        subject: finalSubject,
        html: htmlBody,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      };
      const result = await this.transporter.sendMail(mailOptions);
      // Log success (optional - you may want to remove this or make it configurable)
      await this.logErrorService.logWarning(
        `Email sent successfully to ${recipients.join(', ')}. MessageId: ${result.messageId}`,
        { controller: this.serviceName, methodName: 'sendEmailByType' },
      );
    } catch (error) {
      await this.logErrorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        { controller: this.serviceName, methodName: 'sendEmailByType' },
      );
      // Don't throw an error, just log and skip
      await this.logErrorService.logWarning(
        'Skipping email send due to error.',
        { controller: this.serviceName, methodName: 'sendEmailByType' },
      );
    }
  }

  async renderTemplate(template: string, data: any) {
    return ejs.renderFile(
      path.join(this.templatesPath, `${template}.ejs`),
      data,
      { async: true },
    );
  }
}

