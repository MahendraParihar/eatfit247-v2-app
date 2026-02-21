import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { NotificationChannel } from '../enums/notification-channel.enum';

export class SendDietDto {
  @IsNotEmpty()
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  recipient!: string; // email address or phone number

  @IsNotEmpty()
  @IsNumber()
  memberId!: number;

  @IsNotEmpty()
  @IsNumber()
  dietPlanId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  templateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  customMessage?: string;
}

