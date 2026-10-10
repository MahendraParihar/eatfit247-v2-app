import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IManageFranchiseLut } from '@eatfit247-shared-lib';

export class ManageFranchiseLutDto implements IManageFranchiseLut {
  /** GST ARN of the LUT acknowledgement, e.g. AD270326000123X */
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^AD[0-9A-Z]{13}$/, { message: 'ARN must be 15 characters starting with AD (e.g. AD270326000123X)' })
  arn!: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Financial year must look like 2026-27' })
  financialYear!: string;

  @IsDateString({ strict: true })
  validFrom!: string;

  @IsDateString({ strict: true })
  validTo!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
