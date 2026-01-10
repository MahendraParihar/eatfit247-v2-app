import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { IBasicSearch, IStatusChange } from '@eatfit247-shared-lib';

export class BasicSearchDto implements IBasicSearch {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  page: number = 0;
  
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  limit: number = DEFAULT_PAGE_SIZE;
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
}

export class UpdateActiveDto implements IStatusChange {
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;
}

