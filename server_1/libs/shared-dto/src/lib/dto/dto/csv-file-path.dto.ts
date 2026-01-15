import { IsNotEmpty, IsString } from 'class-validator';

export class CsvFilePathDto {
  @IsString()
  @IsNotEmpty()
  csvFilePath!: string;
}

