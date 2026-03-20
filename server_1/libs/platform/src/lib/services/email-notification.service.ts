import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import * as ejs from 'ejs';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigParam, IEmailData, ISendEmailParams } from '@eatfit247-shared-lib';
import { AppConfigService } from '@server_1/core';
import { LogErrorService, MstEmailTemplate } from '@server_1/platform';

@Injectable()
export class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  private readonly serviceName = 'EmailNotificationService';
  private readonly templatesPath: string;
  private readonly emailSenderId: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly logErrorService: LogErrorService,
    @InjectModel(MstEmailTemplate)
    private readonly emailTemplateRepository: typeof MstEmailTemplate,
  ) {
    // Templates live at server_1/templates/ — resolve relative to CWD (dev) or dist output (prod)
    const cwdPath = path.join(process.cwd(), 'templates');
    const distPath = path.join(__dirname, '../../../../../../templates');
    if (fs.existsSync(cwdPath)) {
      this.templatesPath = cwdPath;
    } else {
      this.templatesPath = distPath;
    }
    // Initialize email transporter
    const mailHost = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_HOST);
    const mailPort = this.appConfigService.getNumber(ConfigParam.SYSTEM_EMAIL_PORT);
    const mailUser = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_USER);
    const mailPassword = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_PASSWORD);
    const enableMail = this.appConfigService.getBoolean(ConfigParam.SYSTEM_EMAIL_ENABLE);
    this.emailSenderId = this.appConfigService.getString(ConfigParam.SYSTEM_EMAIL_USER);
    if (!enableMail || !mailHost || !mailUser || !mailPassword) {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Use dummy transport for testing
      });
    } else {
      // MAIL_SECURE=true  → native TLS on port 465 (most secure)
      // MAIL_SECURE=false → STARTTLS on port 587 (default, still encrypted via requireTLS)
      const mailSecure = this.appConfigService.getBoolean(ConfigParam.SYSTEM_EMAIL_SECURE);
      const defaultPort = mailSecure ? 465 : 587;
      this.transporter = nodemailer.createTransport({
        pool: true,
        host: mailHost,
        secure: mailSecure,
        port: mailPort || defaultPort,
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
        tls: {
          rejectUnauthorized: true,
        },
        ignoreTLS: false,
        requireTLS: !mailSecure, // STARTTLS is required only in non-secure (port 587) mode
      });
    }
  }

  public async sendEmail(params: ISendEmailParams): Promise<void> {
    try {
      // Get email template
      const template = await this.emailTemplateRepository.findOne({
        where: { templateName: params.emailTemplate, active: true },
      });
      if (!template) {
        throw new NotFoundException('Email template not found or inactive');
      }
      // Use provided subject or template default
      let subject = params.subject || template.subject;
      // body: use caller-provided HTML; fallback to rendering the EJS template file
      let body = params.body;
      if (!body && template.emailTemplateFile) {
        const filePath = path.join(this.templatesPath, `${template.emailTemplateFile}.ejs`);
        if (fs.existsSync(filePath)) {
          body = await ejs.renderFile(filePath, params.replacements || {}, { async: true });
        }
      }
      // Replace {{variable}} placeholders in subject and body if replacements provided
      if (params.replacements && subject && typeof subject === 'string') {
        Object.keys(params.replacements).forEach((key) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(params.replacements![key]));
          if (body && typeof body === 'string') {
            body = body.replace(regex, String(params.replacements![key]));
          }
        });
      }
      // Prepare recipients
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      // Prepare attachments
      const attachments =
        params.attachments?.map((att) => ({
          filename: att.filename,
          path: att.path,
          content: att.content,
          contentType: att.contentType,
        })) || [];
      // Send email
      const mailOptions = {
        from: this.emailSenderId,
        to: recipients.join(', '),
        subject: subject,
        html: body,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      await this.transporter.sendMail(mailOptions);
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
      // emailTemplateFile contains the relative path to the EJS file (e.g. "member/diet-plan")
      const templateFile = path.join(this.templatesPath, `${dbTemplate.emailTemplateFile}.ejs`);
      try {
        if (!fs.existsSync(templateFile)) {
          await this.logErrorService.logWarning(
            `EJS template file not found: ${templateFile}. Skipping email send.`,
            { controller: this.serviceName, methodName: 'sendEmailByType' },
          );
          return; // Skip email process if a template file not found
        }
        htmlBody = await ejs.renderFile(templateFile, data, { async: true });
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
      const emailAttachments =
        attachments?.map((att) => ({
          filename: att.filename,
          path: att.path,
          content: att.content,
          contentType: att.contentType,
        })) || [];
      // Send email
      const mailOptions = {
        from: this.emailSenderId,
        to: recipients.join(', '),
        subject: finalSubject,
        html: htmlBody,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      await this.logErrorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        { controller: this.serviceName, methodName: 'sendEmailByType' },
      );
      // Don't throw an error, just log and skip
      await this.logErrorService.logWarning('Skipping email send due to error.', {
        controller: this.serviceName,
        methodName: 'sendEmailByType',
      });
    }
  }

  async renderTemplate(template: string, data: any) {
    return ejs.renderFile(path.join(this.templatesPath, `${template}.ejs`), data, { async: true });
  }

  /**
   * Read and render a WhatsApp message template from the whatspp_template_file field.
   * Returns null if the template is not found or WhatsApp notifications are disabled.
   *
   * @param templateName - The template_name value in mst_email_templates
   * @param variables - Key-value pairs to replace {{variable}} placeholders
   */
  public async getWhatsAppMessageText(
    templateName: string,
    variables: Record<string, string | number> = {},
  ): Promise<string | null> {
    try {
      const dbTemplate = await this.emailTemplateRepository.findOne({
        where: { templateName, active: true },
      });
      if (!dbTemplate || !dbTemplate.sendWhatsappNotification || !dbTemplate.whatsppTemplateFile) {
        return null;
      }
      const templateFile = path.join(this.templatesPath, `${dbTemplate.whatsppTemplateFile}.txt`);
      if (!fs.existsSync(templateFile)) {
        await this.logErrorService.logWarning(
          `WhatsApp template file not found: ${templateFile}`,
          { controller: this.serviceName, methodName: 'getWhatsAppMessageText' },
        );
        return null;
      }
      let text = fs.readFileSync(templateFile, 'utf-8');
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        text = text.replace(regex, String(value));
      });
      return text.trim();
    } catch (error) {
      await this.logErrorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        { controller: this.serviceName, methodName: 'getWhatsAppMessageText' },
      );
      return null;
    }
  }
}
