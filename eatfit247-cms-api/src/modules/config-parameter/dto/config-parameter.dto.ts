import { IsNotEmpty } from 'class-validator';

export class ConfigParamDto {
  @IsNotEmpty()
  configParamId: number;

  @IsNotEmpty()
  configParamValue: string;
}
