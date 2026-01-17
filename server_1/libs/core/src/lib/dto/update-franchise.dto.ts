import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFranchiseDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  franchiseId!: number | null;
}

