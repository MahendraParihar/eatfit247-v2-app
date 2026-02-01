import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  IManageMemberProduct,
  IMemberProductOrderItemBasic,
  IProductVariantTaxResult,
  InputLengthEnum,
  PaymentSourceEnum,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';
import { Type } from 'class-transformer';

export class CreateMemberProductDto implements IManageMemberProduct {
  @IsOptional()
  @IsNumber()
  memberProductId?: number;
  @IsNotEmpty()
  @IsNumber()
  memberId!: number;
  @IsNotEmpty()
  @IsNumber()
  paymentModeId: number;
  @IsNotEmpty()
  @IsNumber()
  billingAddressId: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;
  @IsNotEmpty()
  @IsDateString()
  paymentDate!: Date;
  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currencyCode!: string;
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
  orderAmount!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;
  @IsOptional()
  @IsString()
  paymentLink?: string;
  @IsOptional()
  @IsString()
  gatewayProvider?: string;
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  gatewayPaymentId?: string;
  @IsArray()
  orderItems: IMemberProductOrderItemBasic[];
}

export class MemberProductOrderItemBasicDto implements IMemberProductOrderItemBasic {
  @IsNotEmpty()
  @IsNumber()
  productId!: number;
  @IsNotEmpty()
  @IsNumber()
  productVariantId!: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_5)
  currency!: string;
}

export class CalculateProductVariantTaxDto implements ICalculateProductVariantTaxRequest {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberProductOrderItemBasicDto)
  items!: MemberProductOrderItemBasicDto[];
  @IsOptional()
  @IsNumber()
  billingAddressId?: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;
}

export class ProductVariantTaxResultJurisdictionDto {
  @IsNotEmpty()
  @IsString()
  entityCountry!: string;

  @IsNotEmpty()
  @IsString()
  customerCountry!: string;

  @IsNotEmpty()
  @IsString()
  placeOfSupply!: string;
}

export class ProductVariantTaxResultDto implements IProductVariantTaxResult {
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @IsNotEmpty()
  @IsNumber()
  productVariantId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currencyCode!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxPercentage!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNotEmpty()
  @IsObject()
  taxObj!: Record<string, { amount: number; taxPercentage: number }>;

  @IsNotEmpty()
  @IsEnum(TaxTypeEnum)
  taxType!: TaxTypeEnum;

  @IsNotEmpty()
  @IsEnum(TaxMode)
  taxMode!: TaxMode;

  @IsOptional()
  @IsString()
  invoiceNote?: string;

  @IsNotEmpty()
  @IsBoolean()
  isLutApplied!: boolean;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProductVariantTaxResultJurisdictionDto)
  jurisdiction!: ProductVariantTaxResultJurisdictionDto;
}

export class CalculateProductVariantTaxResponseDto implements ICalculateProductVariantTaxResponse {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantTaxResultDto)
  items!: ProductVariantTaxResultDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxableAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;
}
