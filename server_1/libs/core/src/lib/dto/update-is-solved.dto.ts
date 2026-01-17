import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateIsSolvedDto {
  @IsBoolean()
  @IsNotEmpty()
  isSolved!: boolean;
}

