import { IsNotEmpty, IsNumber } from 'class-validator';

export class RetryNotificationDto {
  @IsNotEmpty()
  @IsNumber()
  id!: number;
}

