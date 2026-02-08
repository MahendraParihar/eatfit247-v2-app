import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for bulk export of member product reports by IDs
 */
export class MemberProductBulkExportDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  memberProductIds: number[];
}

