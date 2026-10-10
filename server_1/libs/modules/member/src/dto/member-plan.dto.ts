import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  IManageMemberPayment,
  InputLengthEnum,
  IPlanTaxCalculationRequest,
  PaymentRouteEnum,
  PaymentSourceEnum,
} from '@eatfit247-shared-lib';

export class CreateMemberPaymentDto implements IManageMemberPayment {
  @IsOptional()
  @IsNumber()
  memberPaymentId?: number;
  @IsNotEmpty()
  @IsNumber()
  memberId!: number;
  @IsOptional()
  @IsNumber()
  paymentModeId!: number;
  @IsNotEmpty()
  @IsNumber()
  programId!: number;
  @IsNotEmpty()
  @IsNumber()
  programPlanId!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfCycle!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfDaysInCycle!: number;
  @IsOptional()
  @IsNumber()
  billingAddressId?: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;
  // Manual payments only: a payment-gateway record's status and date are set by the gateway
  @ValidateIf((o: { paymentSource?: PaymentSourceEnum }) => o.paymentSource === PaymentSourceEnum.MANUAL)
  @IsNotEmpty()
  @IsDateString()
  paymentDate!: Date;
  @ValidateIf((o: { paymentSource?: PaymentSourceEnum }) => o.paymentSource === PaymentSourceEnum.MANUAL)
  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_5)
  currency!: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  promoCode?: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;
  @IsNotEmpty()
  @IsEnum(PaymentSourceEnum)
  paymentSource!: PaymentSourceEnum;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;
  @IsOptional()
  @IsString()
  paymentLink?: string;
  @IsOptional()
  @IsString()
  gatewayProvider?: string;
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;
  /** Payment-gateway records: the admin's gateway choice; the server creates the link after saving. */
  @IsOptional()
  @IsInt()
  @Min(1)
  franchisePaymentGatewayId?: number;
  /** Manual payments only: how the money arrived (export vs IGST for foreign clients); gateway routes are set by the server */
  @ValidateIf((o: { paymentSource?: PaymentSourceEnum }) => o.paymentSource === PaymentSourceEnum.MANUAL)
  @IsOptional()
  @IsEnum(PaymentRouteEnum)
  paymentRoute?: PaymentRouteEnum | null;
  /** FIRC / e-FIRA / bank reference for a foreign route */
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  remittanceReference?: string | null;
}

export class PlanTaxCalculationRequestDto implements IPlanTaxCalculationRequest {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  programPlanId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsOptional()
  @IsNumber()
  billingAddressId?: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsEnum(PaymentSourceEnum)
  paymentSource?: PaymentSourceEnum;
  @IsOptional()
  @IsEnum(PaymentRouteEnum)
  paymentRoute?: PaymentRouteEnum | null;
  @IsOptional()
  @IsDateString()
  paymentDate?: string | null;
}

export class PreviewMemberPaymentUpdateDto extends CreateMemberPaymentDto {}

export class UpdateMemberPaymentDto extends CreateMemberPaymentDto {}

/** Regenerate / cancel payment link: the link the admin saw (409 if another request changed it). */
export class PaymentLinkActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  expectedGatewayOrderId?: string;
}
