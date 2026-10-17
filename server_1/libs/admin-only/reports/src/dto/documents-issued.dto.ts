import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** GSTR-1 Table 13 period (a month, or a quarter for QRMP filers), inclusive. */
export class DocumentsIssuedQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  franchiseId: number;

  @IsDateString({ strict: true })
  from: string;

  @IsDateString({ strict: true })
  to: string;
}
