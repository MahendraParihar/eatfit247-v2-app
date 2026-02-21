import { NotificationChannel, NotificationType } from '@eatfit247-shared-lib';
import { IsNotEmpty, IsOptional, IsString, IsEnum, MaxLength, MinLength, IsObject, IsNumber } from 'class-validator';

export class SendNotificationDto {
  @IsNotEmpty()
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  recipient!: string; // email address or phone number

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  templateName?: string;

  @IsOptional()
  @IsObject()
  templateParams?: Record<string, string | number>;

  @IsOptional()
  @IsNumber()
  memberId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
