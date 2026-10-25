import { IsBoolean, IsOptional } from 'class-validator';
import { IUpdateEmailTemplateSwitch } from '@eatfit247-shared-lib';

export class UpdateEmailTemplateSwitchDto implements IUpdateEmailTemplateSwitch {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  sendEmailNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  sendWhatsappNotification?: boolean;
}
