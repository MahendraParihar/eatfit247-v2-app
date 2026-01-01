import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import {
  BloodSugarService, EatingHabitService,
  GenderService,
  LifestyleService,
  MaritalStatusService,
  ReligionService, SleepingPatternService, TypeOfExerciseService, UrineOutputService,
} from '../../services';
import { IAssessmentMaster } from '@eatfit247-shared-lib';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(
    private readonly genderService: GenderService,
    private readonly maritalStatusService: MaritalStatusService,
    private readonly religionService: ReligionService,
    private readonly lifestyleService: LifestyleService,
    private readonly eatingHabitService: EatingHabitService,
    private readonly typeOfExerciseService: TypeOfExerciseService,
    private readonly sleepingPatternService: SleepingPatternService,
    private readonly bloodSugarService: BloodSugarService,
    private readonly urineOutputService: UrineOutputService,
  ) {}

  @Get('master-data')
  async getMasterData(): Promise<IAssessmentMaster> {
    const [gender,
      maritalStatus,
      religion,
      lifestyle,
      eatingHabit,
      typeOfExercise,
      sleepingPattern,
      bloodSugar,
      urineOutput] = await Promise.all([
      this.genderService.getGenderList(),
      this.maritalStatusService.getMaritalStatusList(),
      this.religionService.getReligionList(),
      this.lifestyleService.getLifestyleList(),
      this.eatingHabitService.getEatingHabitList(),
      this.typeOfExerciseService.getTypeOfExerciseList(),
      this.sleepingPatternService.getSleepingPatternList(),
      this.bloodSugarService.getBloodSugarList(),
      this.urineOutputService.getUrineOutputList(),
    ]);
    return <IAssessmentMaster>{
      gender: gender,
      maritalStatus: maritalStatus,
      religion: religion,
      lifestyle: lifestyle,
      eatingHabit: eatingHabit,
      typeOfExercise: typeOfExercise,
      sleepingPattern: sleepingPattern,
      bloodSugar: bloodSugar,
      urineOutput: urineOutput,
    };
  }
}

