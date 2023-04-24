import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../constants/config-constants';
import { InputLength } from '../constants/input-length';

export class PagingDto {
  @IsNotEmpty()
  pageNumber: number = 0;

  @IsNotEmpty()
  pageSize: number = DEFAULT_PAGE_SIZE;
}

export class BasicSearchDto extends PagingDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  createdFrom?: Date | null;

  @IsOptional()
  createdTo?: Date | null;

  @IsOptional()
  //@IsBoolean()
  active?: boolean | null;
}

export class UpdateActiveDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}

export class UpdateUserStatusDto {
  @IsNumber()
  @IsNotEmpty()
  statusId: number;

  @IsNotEmpty()
  @MaxLength(InputLength.CHAR_1000)
  reason: string;
}

export class GetDetailDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
