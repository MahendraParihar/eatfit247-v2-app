import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { ICreateCreditNote } from '@eatfit247-shared-lib';

export class CreateCreditNoteDto implements ICreateCreditNote {
  @IsIn(['plan', 'product'])
  recordType!: 'plan' | 'product';

  @IsInt()
  @Min(1)
  recordId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsDateString({ strict: true })
  eventDate!: string;
}
