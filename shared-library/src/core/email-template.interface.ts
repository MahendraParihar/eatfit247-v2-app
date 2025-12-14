/// <reference types="node" />
import { IBaseAdminUser } from '../base.interface';

export interface IBaseEmailTemplate {
  templateName: string;
  subject: string;
  body: string;
}

export interface IManageEmailTemplate extends IBaseEmailTemplate {
  emailTemplateId?: number;
  active: boolean;
}

export interface IEmailTemplate extends IBaseEmailTemplate {
  emailTemplateId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface ISendEmailParams {
  emailTemplateId: number;
  to: string | string[];
  subject?: string; // Optional override
  body?: string; // Optional override
  replacements?: Record<string, string>; // For template variable replacement
  attachments?: IEmailAttachment[];
}

export interface IEmailAttachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
}

