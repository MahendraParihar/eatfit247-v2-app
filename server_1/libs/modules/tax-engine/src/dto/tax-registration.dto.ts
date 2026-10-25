import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IManageTaxRegistration, TaxTypeEnum } from '@eatfit247-shared-lib';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

/** A franchise's tax registration (configurable tax treatment, decision 8). The number is checked in the service. */
export class ManageTaxRegistrationDto implements IManageTaxRegistration {
  @IsNotEmpty()
  @Transform(upper)
  @Matches(/^[A-Z]{2,3}$/, { message: 'Country must be an ISO country code' })
  countryCode!: string;

  @IsIn([TaxTypeEnum.GST, TaxTypeEnum.VAT])
  taxSystem!: TaxTypeEnum;

  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  registrationNumber!: string;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z0-9]{10}$/, { message: 'An IEC has 10 characters' })
  iecNumber?: string | null;

  @IsOptional()
  @Transform(upper)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be an ISO 4217 code' })
  currencyCode?: string | null;

  @IsDateString({ strict: true })
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  effectiveTo?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
