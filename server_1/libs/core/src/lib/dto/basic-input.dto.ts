import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IBasicSearch, IStatusChange } from '@eatfit247-shared-lib';

export class BasicSearchDto implements IBasicSearch {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  page: number = 0;
  
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  limit: number = 15;
  @IsOptional()
  @IsString()
  search?: string;
  @IsOptional()
  @IsString()
  name?: string | null;
  @IsOptional()
  createdFrom?: Date | null;
  @IsOptional()
  createdTo?: Date | null;
  @IsOptional()
  active?: boolean | null;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  showOnWebsite?: boolean | null;
  @IsOptional()
  ids?: number[];
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  blogCategoryId?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  faqCategoryId?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  franchiseId?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  includeAdminRoles?: boolean;
  /** Legacy / admin UI query alias for `sortField`. */
  @IsOptional()
  @IsString()
  sortBy?: string;
  /** Legacy / admin UI query alias for `sortDirection` (asc/desc, case-insensitive). */
  @IsOptional()
  @IsString()
  sortOrder?: string;
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.sortBy)
  sortField?: string;
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj.sortOrder;
    if (raw === '' || raw === null || raw === undefined) {
      return undefined;
    }
    const normalized = String(raw).toLowerCase().trim();
    return normalized.length === 0 ? undefined : normalized;
  })
  @IsIn(['asc', 'desc'])
  sortDirection?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  programId?: number;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  isSpecialProgram?: boolean | null;
}

export class UpdateActiveDto implements IStatusChange {
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;
}

