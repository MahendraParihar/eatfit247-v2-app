import { IsBoolean, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageEmailTemplate } from '@eatfit247-shared-lib';

export class CreateEmailTemplateDto implements IManageEmailTemplate {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  templateName!: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  subject!: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(4000)
  @IsNotEmpty()
  body!: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  emailTemplateId?: number;
}

