import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateMemberAssessmentDto {
  @IsOptional()
  dateOfBirth?: string;

  @IsOptional()
  age?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  genderId: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  maritalStatusId: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  religionId: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  lifestyleId: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  eatingHabitId: number;

  @IsOptional()
  tobaccoAmount?: string;

  @IsOptional()
  tobaccoFrequency?: string;

  @IsOptional()
  paan?: string;

  @IsOptional()
  smokingAmount?: string;

  @IsOptional()
  smokingFrequency?: string;

  @IsOptional()
  alcoholDrink?: string;

  @IsOptional()
  alcoholFrequency?: string;

  @IsOptional()
  alcoholAmount?: string;

  @IsOptional()
  aeratedDrinks?: string;

  @IsOptional()
  waterIntake?: string;

  @IsOptional()
  religious?: string;

  @IsOptional()
  fasting?: string;

  @IsOptional()
  restaurantVisit?: string;

  @IsOptional()
  preferredCuisine?: string;

  @IsOptional()
  whoCooks?: string;

  @IsOptional()
  hungerPeak?: string;

  @IsOptional()
  foodDislikes?: string;

  @IsOptional()
  otherFoodPreferences?: string;

  @IsOptional()
  doYouExercise?: string;

  @IsOptional()
  typeOfExerciseId?: number;

  @IsOptional()
  frequency?: string;

  @IsOptional()
  duration?: string;

  @IsOptional()
  time?: string;

  @IsOptional()
  allergies?: string;

  @IsOptional()
  allergySpecify?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  sleepingPatternId: number;

  @IsOptional()
  sleepDuration?: string;

  @IsOptional()
  gas?: string;

  @IsOptional()
  hyperAcidity?: string;

  @IsOptional()
  constipation?: string;

  @IsOptional()
  periods?: string;

  @IsOptional()
  lmp?: string;

  @IsOptional()
  daysCycle?: string;

  @IsOptional()
  hairFall?: string;

  @IsOptional()
  kneePain?: string;

  @IsOptional()
  backPain?: string;

  @IsOptional()
  bloodSugarId?: number;

  @IsOptional()
  bloodSugarValue?: string;

  @IsOptional()
  cholesterol?: string;

  @IsOptional()
  triglycerides?: string;

  @IsOptional()
  hdlCholesterol?: string;

  @IsOptional()
  ldlCholesterol?: string;

  @IsOptional()
  vldlCholesterol?: string;

  @IsOptional()
  hgLevel?: string;

  @IsOptional()
  @IsNumber()
  urineOutputId?: number;

  @IsOptional()
  supplementMedicine?: string;

  @IsOptional()
  wakeupTiming?: string;

  @IsOptional()
  bfMenu?: string;

  @IsOptional()
  bfTime?: string;

  @IsOptional()
  mmMenu?: string;

  @IsOptional()
  mmTime?: string;

  @IsOptional()
  lunchMenu?: string;

  @IsOptional()
  lunchTime?: string;

  @IsOptional()
  eveMenu?: string;

  @IsOptional()
  eveTime?: string;

  @IsOptional()
  midEveMenu?: string;

  @IsOptional()
  midEveTime?: string;

  @IsOptional()
  dinnerMenu?: string;

  @IsOptional()
  dinnerTime?: string;

  @IsOptional()
  nightSnacks?: string;

  @IsOptional()
  bedTime?: string;

  @IsOptional()
  fruitsFrequency?: string;

  @IsOptional()
  breakFrequency?: string;

  @IsOptional()
  breadAmount?: string;

  @IsOptional()
  sweetFrequency?: string;

  @IsOptional()
  sweetAmount?: string;

  @IsOptional()
  teaFrequency?: string;

  @IsOptional()
  teaAmount?: string;

  @IsOptional()
  remark?: string;

  @IsOptional()
  nutritionistSummery?: string;
}
