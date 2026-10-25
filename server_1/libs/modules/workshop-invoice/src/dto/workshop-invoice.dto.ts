import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ICancelWorkshopInvoice,
  IManageWorkshopInvoice,
  IWorkshopInvoiceSearch,
  IWorkshopInvoiceTaxRequest,
  PaymentStatusEnum,
} from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/core';

const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** 15-character GSTIN: 2-digit State code, PAN, entity number, 'Z', checksum. */
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE = /^[+0-9][0-9 ()-]{5,24}$/;

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class WorkshopInvoiceTaxDto implements IWorkshopInvoiceTaxRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  franchiseId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  billToCountryId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  billToStateId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  placeOfSupplyStateId?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000000)
  unitRate: number;

  @Transform(trim)
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency: string;
}

export class ManageWorkshopInvoiceDto extends WorkshopInvoiceTaxDto implements IManageWorkshopInvoice {
  @Matches(DATE_ONLY)
  invoiceDate: string;

  @Matches(DATE_ONLY)
  supplyDate: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  billToName: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  billToContactPerson?: string | null;

  @IsOptional()
  @Transform(trim)
  @ValidateIf((o: ManageWorkshopInvoiceDto) => hasValue(o.billToEmail))
  @IsEmail()
  @MaxLength(150)
  billToEmail?: string | null;

  @IsOptional()
  @Transform(trim)
  @ValidateIf((o: ManageWorkshopInvoiceDto) => hasValue(o.billToPhone))
  @Matches(PHONE)
  billToPhone?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @ValidateIf((o: ManageWorkshopInvoiceDto) => hasValue(o.billToGstin))
  @Matches(GSTIN)
  billToGstin?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  billToAddressLine1: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(250)
  billToAddressLine2?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  billToCity: string;

  /** 6 digits for India, checked in the service once the country is known. */
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9 -]{3,10}$/)
  billToPinCode: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @Type(() => Number)
  @IsInt()
  @IsIn(Object.values(PaymentStatusEnum).filter((v) => typeof v === 'number'))
  paymentStatusId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paymentModeId?: number | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(250)
  transactionId?: string | null;

  @IsOptional()
  @ValidateIf((o: ManageWorkshopInvoiceDto) => hasValue(o.paymentDate))
  @Matches(DATE_ONLY)
  paymentDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  confirmBackdate?: boolean;
}

export class CancelWorkshopInvoiceDto implements ICancelWorkshopInvoice {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cancelReason: string;
}

export class WorkshopInvoiceSearchDto extends BasicSearchDto implements IWorkshopInvoiceSearch {
  // franchiseId comes from BasicSearchDto

  @IsOptional()
  @Matches(DATE_ONLY)
  invoiceDateFrom?: string | null;

  @IsOptional()
  @Matches(DATE_ONLY)
  invoiceDateTo?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paymentStatusId?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsBoolean()
  includeCancelled?: boolean | null;
}
