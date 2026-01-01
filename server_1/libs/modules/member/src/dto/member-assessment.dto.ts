import { IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { IManageMemberAssessment, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateMemberAssessmentDto implements IManageMemberAssessment {
  @IsNotEmpty()
  @IsNumber()
  memberId!: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  dateOfBirth?: Date;
  @IsOptional()
  age?: number;
  @IsNotEmpty()
  @IsNumber()
  genderId!: number;
  @IsNotEmpty()
  @IsNumber()
  maritalStatusId!: number;
  @IsNotEmpty()
  @IsNumber()
  religionId!: number;
  @IsNotEmpty()
  @IsNumber()
  lifestyleId!: number;
  @IsNotEmpty()
  @IsNumber()
  eatingHabitId!: number;
  @IsOptional()
  @MaxLength(100)
  tobaccoAmount?: string;
  @IsOptional()
  @MaxLength(100)
  tobaccoFrequency?: string;
  @IsOptional()
  @MaxLength(100)
  paan?: string;
  @IsOptional()
  @MaxLength(100)
  smokingAmount?: string;
  @IsOptional()
  @MaxLength(100)
  smokingFrequency?: string;
  @IsOptional()
  @MaxLength(100)
  alcoholDrink?: string;
  @IsOptional()
  @MaxLength(100)
  alcoholFrequency?: string;
  @IsOptional()
  @MaxLength(100)
  alcoholAmount?: string;
  @IsOptional()
  @MaxLength(100)
  aeratedDrinks?: string;
  @IsOptional()
  @MaxLength(100)
  waterIntake?: string;
  @IsOptional()
  @MaxLength(100)
  religious?: string;
  @IsOptional()
  @MaxLength(100)
  fasting?: string;
  @IsOptional()
  @MaxLength(100)
  restaurantVisit?: string;
  @IsOptional()
  @MaxLength(100)
  preferredCuisine?: string;
  @IsOptional()
  @MaxLength(100)
  whoCooks?: string;
  @IsOptional()
  @MaxLength(100)
  hungerPeak?: string;
  @IsOptional()
  @MaxLength(100)
  foodDislikes?: string;
  @IsOptional()
  @MaxLength(100)
  otherFoodPreferences?: string;
  @IsOptional()
  @MaxLength(100)
  doYouExercise?: string;
  @IsOptional()
  @IsNumber()
  typeOfExerciseId?: number;
  @IsOptional()
  @MaxLength(100)
  frequency?: string;
  @IsOptional()
  @MaxLength(100)
  duration?: string;
  @IsOptional()
  @MaxLength(100)
  time?: string;
  @IsOptional()
  @MaxLength(100)
  allergies?: string;
  @IsOptional()
  @MaxLength(100)
  allergySpecify?: string;
  @IsNotEmpty()
  @IsNumber()
  sleepingPatternId!: number;
  @IsOptional()
  @MaxLength(100)
  sleepDuration?: string;
  @IsOptional()
  @MaxLength(100)
  gas?: string;
  @IsOptional()
  @MaxLength(100)
  hyperAcidity?: string;
  @IsOptional()
  @MaxLength(100)
  constipation?: string;
  @IsOptional()
  @MaxLength(100)
  periods?: string;
  @IsOptional()
  @MaxLength(100)
  lmp?: string;
  @IsOptional()
  @MaxLength(100)
  daysCycle?: string;
  @IsOptional()
  @MaxLength(100)
  hairFall?: string;
  @IsOptional()
  @MaxLength(100)
  kneePain?: string;
  @IsOptional()
  @MaxLength(100)
  backPain?: string;
  @IsOptional()
  @IsNumber()
  bloodSugarId?: number;
  @IsOptional()
  @MaxLength(100)
  bloodSugarValue?: string;
  @IsOptional()
  @MaxLength(100)
  cholesterol?: string;
  @IsOptional()
  @MaxLength(100)
  triglycerides?: string;
  @IsOptional()
  @MaxLength(100)
  hdlCholesterol?: string;
  @IsOptional()
  @MaxLength(100)
  ldlCholesterol?: string;
  @IsOptional()
  @MaxLength(100)
  vldlCholesterol?: string;
  @IsOptional()
  @MaxLength(100)
  hgLevel?: string;
  @IsOptional()
  @IsNumber()
  urineOutputId?: number;
  @IsOptional()
  @MaxLength(100)
  supplementMedicine?: string;
  @IsOptional()
  @MaxLength(100)
  wakeupTiming?: string;
  @IsOptional()
  @MaxLength(250)
  bfMenu?: string;
  @IsOptional()
  @MaxLength(250)
  bfTime?: string;
  @IsOptional()
  @MaxLength(250)
  mmMenu?: string;
  @IsOptional()
  @MaxLength(250)
  mmTime?: string;
  @IsOptional()
  @MaxLength(250)
  lunchMenu?: string;
  @IsOptional()
  @MaxLength(250)
  lunchTime?: string;
  @IsOptional()
  @MaxLength(250)
  eveMenu?: string;
  @IsOptional()
  @MaxLength(250)
  eveTime?: string;
  @IsOptional()
  @MaxLength(250)
  midEveMenu?: string;
  @IsOptional()
  @MaxLength(250)
  midEveTime?: string;
  @IsOptional()
  @MaxLength(250)
  dinnerMenu?: string;
  @IsOptional()
  @MaxLength(250)
  dinnerTime?: string;
  @IsOptional()
  @MaxLength(250)
  nightSnacks?: string;
  @IsOptional()
  @MaxLength(250)
  bedTime?: string;
  @IsOptional()
  @MaxLength(250)
  fruitsFrequency?: string;
  @IsOptional()
  @MaxLength(250)
  breakFrequency?: string;
  @IsOptional()
  @MaxLength(250)
  breadAmount?: string;
  @IsOptional()
  @MaxLength(250)
  sweetFrequency?: string;
  @IsOptional()
  @MaxLength(250)
  sweetAmount?: string;
  @IsOptional()
  @MaxLength(250)
  teaFrequency?: string;
  @IsOptional()
  @MaxLength(250)
  teaAmount?: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_2000)
  remark?: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_2000)
  nutritionistSummery?: string;
}
