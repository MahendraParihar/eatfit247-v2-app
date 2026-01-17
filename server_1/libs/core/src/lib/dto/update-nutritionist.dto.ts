import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNutritionistDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  nutritionistId!: number | null;
}

