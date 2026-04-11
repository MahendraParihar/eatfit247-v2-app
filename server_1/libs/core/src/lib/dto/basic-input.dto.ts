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
  @IsOptional()
  @IsString()
  sortField?: string;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return String(value).toLowerCase();
  })
  @IsIn(['asc', 'desc'])
  sortDirection?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  programId?: number;
}

export class UpdateActiveDto implements IStatusChange {
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;
}

