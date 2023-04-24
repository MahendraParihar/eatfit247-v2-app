import { IsNotEmpty, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DietPlanDetailDto } from 'src/modules/member/dto/member-diet-plan-detail.dto';

export class DietTemplateDetailDto {
  @IsNumber()
  @IsNotEmpty()
  @Max(64)
  @Min(1)
  cycleNo: number;

  @IsNumber()
  @Max(365)
  @Min(1)
  dayNo: number;

  @IsNumber()
  @IsNotEmpty()
  dietTemplateId: number;

  @ValidateNested({ each: true })
  @Type(() => DietPlanDetailDto)
  dietPlan: DietPlanDetailDto[];
}
