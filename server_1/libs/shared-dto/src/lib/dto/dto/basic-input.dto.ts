import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { IBasicSearch, IStatusChange } from '@eatfit247-shared-lib';

export class BasicSearchDto implements IBasicSearch {
  @IsNotEmpty()
  page: number = 0;
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
}

export class UpdateActiveDto implements IStatusChange {
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;
}

