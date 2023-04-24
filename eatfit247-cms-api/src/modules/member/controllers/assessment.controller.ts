import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonService } from '../../common/common.service';
import { FranchiseService } from '../../franchise/franchise.service';
import { GenderService } from '../../lov/services/gender.service';
import { MaritalStatusService } from '../../lov/services/marital-status.service';
import { ReligionService } from '../../lov/services/religion.service';
import { LifestyleService } from '../../lov/services/lifestyle.service';
import { EatingHabitService } from '../../lov/services/eating-habit.service';
import { TypeOfExerciseService } from '../../lov/services/type-of-exercise.service';
import { SleepingPatternService } from '../../lov/services/sleeping-pattern.service';
import { BloodSugarService } from '../../lov/services/blood-sugar.service';
import { UrineOutputService } from '../../lov/services/urine-output.service';
import { CreateMemberAssessmentDto } from '../dto/member-assessment.dto';
import { AssessmentService } from '../services/assessment.service';

@Controller('member-assessment')
export class AssessmentController {
  constructor(
    private readonly service: AssessmentService,
    private readonly commonService: CommonService,
    private readonly franchiseService: FranchiseService,
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

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async createOrUpdate(@Param('id') id: number, @Req() req, @Body() body: CreateMemberAssessmentDto) {
    return await this.service.createOrUpdate(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data')
  async memberMaster(@Req() req: any) {
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        gender: await this.genderService.getGenderList(),
        maritalStatus: await this.maritalStatusService.getMaritalStatusList(),
        religion: await this.religionService.getReligionList(),
        lifestyle: await this.lifestyleService.getLifestyleList(),
        eatingHabit: await this.eatingHabitService.getEatingHabitList(),
        typeOfExercise: await this.typeOfExerciseService.getTypeOfExerciseList(),
        sleepingPattern: await this.sleepingPatternService.getSleepingPatternList(),
        bloodSugar: await this.bloodSugarService.getBloodSugarList(),
        urineOutput: await this.urineOutputService.getUrineOutputList(),
      },
    };
  }
}
