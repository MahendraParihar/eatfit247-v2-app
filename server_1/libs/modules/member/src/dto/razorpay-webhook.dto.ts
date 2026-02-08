import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RazorpayPaymentEntityDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @IsString()
  @IsOptional()
  invoice_id?: string | null;

  @IsBoolean()
  @IsNotEmpty()
  international!: boolean;

  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsNumber()
  @IsNotEmpty()
  amount_refunded!: number;

  @IsString()
  @IsOptional()
  refund_status?: string | null;

  @IsBoolean()
  @IsNotEmpty()
  captured!: boolean;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  card_id?: string | null;

  @IsString()
  @IsOptional()
  bank?: string | null;

  @IsString()
  @IsOptional()
  wallet?: string | null;

  @IsString()
  @IsOptional()
  vpa?: string | null;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;

  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  fee?: number | null;

  @IsNumber()
  @IsOptional()
  tax?: number | null;

  @IsString()
  @IsOptional()
  error_code?: string | null;

  @IsString()
  @IsOptional()
  error_description?: string | null;

  @IsString()
  @IsOptional()
  error_source?: string | null;

  @IsString()
  @IsOptional()
  error_step?: string | null;

  @IsString()
  @IsOptional()
  error_reason?: string | null;

  @IsObject()
  @IsOptional()
  acquirer_data?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;
}

export class RazorpayPaymentDto {
  @ValidateNested()
  @Type(() => RazorpayPaymentEntityDto)
  @IsNotEmpty()
  entity!: RazorpayPaymentEntityDto;
}

export class RazorpayPaymentLinkCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;
}

export class RazorpayPaymentLinkEntityDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @ValidateNested()
  @Type(() => RazorpayPaymentLinkCustomerDto)
  @IsNotEmpty()
  customer!: RazorpayPaymentLinkCustomerDto;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;
}

export class RazorpayPaymentLinkDto {
  @ValidateNested()
  @Type(() => RazorpayPaymentLinkEntityDto)
  @IsNotEmpty()
  entity!: RazorpayPaymentLinkEntityDto;
}

export class RazorpayOrderEntityDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsNumber()
  @IsNotEmpty()
  amount_paid!: number;

  @IsNumber()
  @IsNotEmpty()
  amount_due!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  receipt!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsNumber()
  @IsNotEmpty()
  attempts!: number;

  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;
}

export class RazorpayOrderDto {
  @ValidateNested()
  @Type(() => RazorpayOrderEntityDto)
  @IsNotEmpty()
  entity!: RazorpayOrderEntityDto;
}

export class RazorpayWebhookPayloadDto {
  @ValidateNested()
  @Type(() => RazorpayPaymentDto)
  @IsOptional()
  payment?: RazorpayPaymentDto;

  @ValidateNested()
  @Type(() => RazorpayPaymentLinkDto)
  @IsOptional()
  payment_link?: RazorpayPaymentLinkDto;

  @ValidateNested()
  @Type(() => RazorpayOrderDto)
  @IsOptional()
  order?: RazorpayOrderDto;
}

export class RazorpayWebhookDto {
  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsString()
  @IsNotEmpty()
  account_id!: string;

  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  contains!: string[];

  @ValidateNested()
  @Type(() => RazorpayWebhookPayloadDto)
  @IsNotEmpty()
  payload!: RazorpayWebhookPayloadDto;
}

