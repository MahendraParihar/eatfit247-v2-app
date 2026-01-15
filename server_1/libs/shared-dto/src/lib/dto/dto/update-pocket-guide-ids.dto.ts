import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePocketGuideIdsDto {
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  pocketGuideIds!: number[];
}

