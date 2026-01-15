import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { InputLengthEnum } from '@eatfit247-shared-lib';

export class UpdateMemberStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  active!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_1000)
  deactivationReason?: string;
}

