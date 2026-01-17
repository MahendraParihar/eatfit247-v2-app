import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { InputLengthEnum } from '@eatfit247-shared-lib';

export class SendContactFormResponseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_1000)
  respondedMessage!: string;
}

