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

export class RazorpayPaymentAuthenticationDto {
  @IsString()
  @IsOptional()
  authentication_channel?: string;

  @IsString()
  @IsOptional()
  version?: string;
}

export class RazorpayPaymentCardDto {
  @IsString()
  @IsOptional()
  entity?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsBoolean()
  @IsOptional()
  emi?: boolean;

  @IsBoolean()
  @IsOptional()
  international?: boolean;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsString()
  @IsOptional()
  last4?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  network?: string;

  @IsString()
  @IsOptional()
  sub_type?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

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

  @IsNumber()
  @IsOptional()
  amount_captured?: number;

  @IsNumber()
  @IsOptional()
  amount_transferred?: number;

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

  @IsString()
  @IsOptional()
  fee_bearer?: string;

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

  @ValidateNested()
  @Type(() => RazorpayPaymentAuthenticationDto)
  @IsOptional()
  authentication?: RazorpayPaymentAuthenticationDto;

  @ValidateNested()
  @Type(() => RazorpayPaymentCardDto)
  @IsOptional()
  card?: RazorpayPaymentCardDto;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;

  @IsObject()
  @IsOptional()
  reward?: any | null;

  @IsObject()
  @IsOptional()
  upi?: {
    vpa?: string;
    flow?: string;
  } | null;

  @IsNumber()
  @IsOptional()
  base_amount?: number;
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

export class RazorpayPaymentLinkNotifyDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @IsBoolean()
  @IsOptional()
  whatsapp?: boolean;
}

export class RazorpayPaymentLinkRemindersDto {
  @IsString()
  @IsOptional()
  status?: string;
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

  @IsNumber()
  @IsOptional()
  amount_paid?: number;

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
  notes?: Record<string, any> | null;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;

  @IsBoolean()
  @IsOptional()
  accept_partial?: boolean;

  @IsString()
  @IsOptional()
  callback_method?: string;

  @IsString()
  @IsOptional()
  callback_url?: string;

  @IsNumber()
  @IsOptional()
  cancelled_at?: number;

  @IsNumber()
  @IsOptional()
  expire_by?: number;

  @IsNumber()
  @IsOptional()
  expired_at?: number;

  @IsNumber()
  @IsOptional()
  first_min_partial_amount?: number;

  @ValidateNested()
  @Type(() => RazorpayPaymentLinkNotifyDto)
  @IsOptional()
  notify?: RazorpayPaymentLinkNotifyDto;

  @IsString()
  @IsOptional()
  order_id?: string;

  @IsString()
  @IsOptional()
  reference_id?: string;

  @IsBoolean()
  @IsOptional()
  reminder_enable?: boolean;

  @ValidateNested()
  @Type(() => RazorpayPaymentLinkRemindersDto)
  @IsOptional()
  reminders?: RazorpayPaymentLinkRemindersDto;

  @IsString()
  @IsOptional()
  short_url?: string;

  @IsNumber()
  @IsOptional()
  updated_at?: number;

  @IsBoolean()
  @IsOptional()
  upi_link?: boolean;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsBoolean()
  @IsOptional()
  whatsapp_link?: boolean;
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

  @IsString()
  @IsOptional()
  account_number?: string | null;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsNumber()
  @IsNotEmpty()
  amount_paid!: number;

  @IsNumber()
  @IsNotEmpty()
  amount_due!: number;

  @IsBoolean()
  @IsOptional()
  app_offer?: boolean;

  @IsNumber()
  @IsNotEmpty()
  attempts!: number;

  @IsBoolean()
  @IsOptional()
  authorized?: boolean;

  @IsString()
  @IsOptional()
  bank?: string | null;

  @IsObject()
  @IsOptional()
  bank_account?: any | null;

  @IsString()
  @IsOptional()
  checkout_config_id?: string | null;

  @IsNumber()
  @IsNotEmpty()
  created_at!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsOptional()
  customer_id?: string | null;

  @IsBoolean()
  @IsOptional()
  discount?: boolean;

  @IsNumber()
  @IsOptional()
  first_payment_min_amount?: number;

  @IsString()
  @IsOptional()
  force_offer?: string | null;

  @IsString()
  @IsOptional()
  late_auth_config_id?: string | null;

  @IsString()
  @IsOptional()
  merchant_id?: string;

  @IsString()
  @IsOptional()
  method?: string | null;

  @IsObject()
  @IsOptional()
  notes?: Record<string, any> | null;

  @IsObject()
  @IsOptional()
  offers?: Record<string, any>;

  @IsArray()
  @IsOptional()
  order_metas?: any[];

  @IsArray()
  @IsOptional()
  order_relationships?: any[];

  @IsBoolean()
  @IsOptional()
  partial_payment?: boolean;

  @IsString()
  @IsOptional()
  payer_name?: string | null;

  @IsBoolean()
  @IsOptional()
  payment_capture?: boolean;

  @IsString()
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  product_type?: string;

  @IsObject()
  @IsOptional()
  provider_context?: any | null;

  @IsString()
  @IsOptional()
  public_key?: string;

  @IsObject()
  @IsOptional()
  public_response?: any | null;

  @IsString()
  @IsOptional()
  receipt?: string | null;

  @IsString()
  @IsOptional()
  reference2?: string | null;

  @IsString()
  @IsOptional()
  reference3?: string | null;

  @IsString()
  @IsOptional()
  reference4?: string | null;

  @IsString()
  @IsOptional()
  reference5?: string | null;

  @IsString()
  @IsOptional()
  reference6?: string | null;

  @IsString()
  @IsOptional()
  reference7?: string | null;

  @IsString()
  @IsOptional()
  reference8?: string | null;

  @IsString()
  @IsOptional()
  source?: string | null;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsObject()
  @IsOptional()
  transfers?: any | null;

  @IsNumber()
  @IsOptional()
  updated_at?: number;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsObject()
  @IsOptional()
  checkout?: any | null;
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

  @IsNumber()
  @IsOptional()
  created_at?: number;
}

