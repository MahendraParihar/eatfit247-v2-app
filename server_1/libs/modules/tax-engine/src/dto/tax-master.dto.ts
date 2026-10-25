import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  ElectronicConditionEnum,
  ITaxRulePreviewRequest,
  MoneyConditionEnum,
  PaymentRouteEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TaxCategoryEnum,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() || null : value);

export class CreateTaxMasterDto {
  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;

  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  countryCode!: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsNotEmpty()
  @IsEnum(TaxTypeEnum)
  taxSystem!: TaxTypeEnum;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  taxCode!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  taxName!: string;

  @IsNotEmpty()
  @IsNumber()
  taxPercent!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  applyOn!: string;

  @IsNotEmpty()
  @IsBoolean()
  isTaxInclusive!: boolean;

  /** VAT category; defaults to STANDARD */
  @IsOptional()
  @IsEnum(TaxCategoryEnum)
  taxCategory?: TaxCategoryEnum;

  /** HSN (goods) or SAC (services), 4–8 digits */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'hsnSacCode must be 4 to 8 digits' })
  hsnSacCode?: string | null;

  /** Notification / article / adviser note for this rate */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  legalBasis?: string | null;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveFrom!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date | null;
  // ---- Conditions and treatment (configurable tax treatment, decisions 3, 7, 9). Optional: an omitted field keeps
  // the stored value on update, and today's shape (same country, every condition any, CHARGE) on create.

  @IsOptional()
  @IsEnum(CustomerScopeEnum)
  customerScope?: CustomerScopeEnum;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{2,3}$/, { message: 'placeOfSupplyCountryCode must be an ISO country code' })
  placeOfSupplyCountryCode?: string | null;

  @IsOptional()
  @IsEnum(StateRelationEnum)
  stateRelation?: StateRelationEnum;

  @IsOptional()
  @IsEnum(RegistrationConditionEnum)
  registrationCondition?: RegistrationConditionEnum;

  @IsOptional()
  @IsEnum(CustomerTypeConditionEnum)
  customerTypeCondition?: CustomerTypeConditionEnum;

  @IsOptional()
  @IsEnum(ElectronicConditionEnum)
  electronicCondition?: ElectronicConditionEnum;

  @IsOptional()
  @IsEnum(MoneyConditionEnum)
  moneyCondition?: MoneyConditionEnum;

  @IsOptional()
  @IsEnum(RuleAppliesToEnum)
  appliesTo?: RuleAppliesToEnum;

  @IsOptional()
  @IsEnum(TaxTreatmentEnum)
  treatment?: TaxTreatmentEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  refusalMessage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  invoiceNote?: string | null;

  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;

  @IsOptional()
  @IsInt()
  fallbackTaxMasterId?: number | null;

  @IsOptional()
  @IsBoolean()
  fallbackOnly?: boolean;
  /** Create only: false = a staged rule (prepared before its registration exists); status changes use update-status */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/** `POST tax-master/preview` (decision 7): which rule would price this sale; nothing is saved. */
export class TaxRulePreviewDto implements ITaxRulePreviewRequest {
  @IsInt()
  franchiseId!: number;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsInt()
  referenceId!: number;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{2,3}$/, { message: 'billingCountryCode must be an ISO country code' })
  billingCountryCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  billingStateCode?: string | null;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{2,3}$/, { message: 'deliveryCountryCode must be an ISO country code' })
  deliveryCountryCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  deliveryStateCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  customerRegistrationNumber?: string | null;

  @IsOptional()
  @IsEnum(PaymentRouteEnum)
  paymentRoute?: PaymentRouteEnum | null;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO 4217 code' })
  currency?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  supplyDate?: string | null;

  @IsOptional()
  @IsNumber()
  amount?: number | null;
}

