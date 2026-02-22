/// <reference types="node" />
import { IAdminInfo } from '../base.interface';
import { EmailTemplateEnum } from '../enum';

export interface IBaseEmailTemplate {
  templateName: string;
  subject: string;
  body: string;
}

export interface IManageEmailTemplate extends IBaseEmailTemplate {
  emailTemplateId?: number;
  active: boolean;
}

export interface IEmailTemplate extends IBaseEmailTemplate, IAdminInfo {
  emailTemplateId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
}

export interface ISendEmailParams {
  emailTemplate: EmailTemplateEnum;
  to: string | string[];
  franchiseBranding: { logoUrl: string, brandName: string };
  subject?: string; // Optional override
  body?: string; // Optional override
  from?: string;
  replacements?: { [key: string]: string | number }; // For template variable replacement
  attachments?: IEmailAttachment[];
}

export interface IEmailAttachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
}

