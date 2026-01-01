import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ISendEmailParams, IEmailAttachment } from '@eatfit247-shared-lib';

export class EmailAttachmentDto implements IEmailAttachment {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  content?: string | Buffer;

  @IsOptional()
  @IsString()
  contentType?: string;
}

export class SendEmailDto implements ISendEmailParams {
  @IsNotEmpty()
  @IsNumber()
  emailTemplateId: number;

  @IsNotEmpty()
  @IsEmail({}, { each: true })
  to: string | string[];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  replacements?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}

