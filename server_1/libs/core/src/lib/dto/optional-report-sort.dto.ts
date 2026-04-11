import { IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/** Optional sort fields for POST report filters (admin tables). */
export class OptionalReportSortDto {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const v = String(value).toLowerCase().trim();
    if (v !== 'asc' && v !== 'desc') {
      return undefined;
    }
    return v;
  })
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
