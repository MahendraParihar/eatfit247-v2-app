import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHealthParameterLogDto {
  @ValidateNested({ each: true })
  @Type(() => MemberHealthParameterDto)
  bodyStats: MemberHealthParameterDto[];

  @IsNotEmpty()
  @Type(() => Date)
  logDate: Date;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;
}

export class MemberHealthParameterDto {
  @IsNotEmpty()
  healthParameterId: number;

  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsNotEmpty()
  healthParameterUnitId?: number;
}
