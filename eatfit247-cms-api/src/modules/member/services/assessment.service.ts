import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { IServerResponse } from '../../../common-dto/response-interface';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment';
import { Sequelize } from 'sequelize-typescript';
import { DB_DATE_FORMAT, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { MstGender } from '../../../core/database/models/mst-gender.model';
import { MstMaritalStatus } from '../../../core/database/models/mst-marital-status.model';
import { MstReligion } from '../../../core/database/models/mst-religion.model';
import { MstLifestyle } from '../../../core/database/models/mst-lifestyle.model';
import { MstEatingHabit } from '../../../core/database/models/mst-eating-habit.model';
import { MstTypeOfExercise } from '../../../core/database/models/mst-type-of-exercise.model';
import { MstSleepingPattern } from '../../../core/database/models/mst-sleeping-pattern.model';
import { MstBloodSugar } from '../../../core/database/models/mst-blood-sugar.model';
import { MstUrineOutput } from '../../../core/database/models/mst-urine-output.model';
import { IMemberAssessment } from '../../../response-interface/member-assessment.interface';
import { TxnAssessment } from '../../../core/database/models/txn-assessment.model';
import { CreateMemberAssessmentDto } from '../dto/member-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectModel(TxnAssessment) private readonly assessmentRepository: typeof TxnAssessment,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {}

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.assessmentRepository.findOne({
        include: [
          {
            model: MstGender,
            required: false,
            as: 'MemberAssessmentGender',
          },
          {
            model: MstMaritalStatus,
            required: false,
            as: 'MemberAssessmentMaritalStatus',
          },
          {
            model: MstReligion,
            required: false,
            as: 'MemberAssessmentReligion',
          },
          {
            model: MstLifestyle,
            required: false,
            as: 'MemberAssessmentLifestyle',
          },
          {
            model: MstEatingHabit,
            required: false,
            as: 'MemberAssessmentEatingHabit',
          },
          {
            model: MstTypeOfExercise,
            required: false,
            as: 'MemberAssessmentTypeOfExercise',
          },
          {
            model: MstSleepingPattern,
            required: false,
            as: 'MemberAssessmentSleepingPattern',
          },
          {
            model: MstBloodSugar,
            required: false,
            as: 'MemberAssessmentBloodSugar',
          },
          {
            model: MstUrineOutput,
            required: false,
            as: 'MemberAssessmentUrineOutput',
          },
        ],
        where: {
          memberId: id,
        },
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = <IMemberAssessment>{
          assessmentId: find.assessmentId,
          memberId: find.memberId,
          dateOfBirth: find.dateOfBirth ? moment(find.dateOfBirth, DB_DATE_FORMAT) : null,
          age: find.age,
          genderId: find.genderId,
          maritalStatusId: find.maritalStatusId,
          religionId: find.religionId,
          lifestyleId: find.lifestyleId,
          eatingHabitId: find.eatingHabitId,
          tobaccoAmount: find.tobaccoAmount,
          tobaccoFrequency: find.tobaccoFrequency,
          paan: find.paan,
          smokingAmount: find.smokingAmount,
          smokingFrequency: find.smokingFrequency,
          alcoholDrink: find.alcoholDrink,
          alcoholFrequency: find.alcoholFrequency,
          alcoholAmount: find.alcoholAmount,
          aeratedDrinks: find.aeratedDrinks,
          waterIntake: find.waterIntake,
          religious: find.religious,
          fasting: find.fasting,
          restaurantVisit: find.restaurantVisit,
          preferredCuisine: find.preferredCuisine,
          whoCooks: find.whoCooks,
          hungerPeak: find.hungerPeak,
          foodDislikes: find.foodDislikes,
          otherFoodPreferences: find.otherFoodPreferences,
          doYouExercise: find.doYouExercise,
          typeOfExerciseId: find.typeOfExerciseId,
          frequency: find.frequency,
          duration: find.duration,
          time: find.time,
          allergies: find.allergies,
          allergySpecify: find.allergySpecify,
          sleepingPatternId: find.sleepingPatternId,
          sleepDuration: find.sleepDuration,
          gas: find.gas,
          hyperAcidity: find.hyperAcidity,
          constipation: find.constipation,
          periods: find.periods,
          lmp: find.lmp,
          daysCycle: find.daysCycle,
          hairFall: find.hairFall,
          kneePain: find.kneePain,
          backPain: find.backPain,
          bloodSugarId: find.bloodSugarId,
          bloodSugarValue: find.bloodSugarValue,
          cholesterol: find.cholesterol,
          triglycerides: find.triglycerides,
          hdlCholesterol: find.hdlCholesterol,
          ldlCholesterol: find.ldlCholesterol,
          vldlCholesterol: find.vldlCholesterol,
          hgLevel: find.hgLevel,
          urineOutputId: find.urineOutputId,
          supplementMedicine: find.supplementMedicine,
          wakeupTiming: find.wakeupTiming,
          bfMenu: find.bfMenu,
          bfTime: find.bfTime,
          mmMenu: find.mmMenu,
          mmTime: find.mmTime,
          lunchMenu: find.lunchMenu,
          lunchTime: find.lunchTime,
          eveMenu: find.eveMenu,
          eveTime: find.eveTime,
          midEveMenu: find.midEveMenu,
          midEveTime: find.midEveTime,
          dinnerMenu: find.dinnerMenu,
          dinnerTime: find.dinnerTime,
          nightSnacks: find.nightSnacks,
          bedTime: find.bedTime,
          fruitsFrequency: find.fruitsFrequency,
          breakFrequency: find.breakFrequency,
          breadAmount: find.breadAmount,
          sweetFrequency: find.sweetFrequency,
          sweetAmount: find.sweetAmount,
          teaFrequency: find.teaFrequency,
          teaAmount: find.teaAmount,
          remark: find.remark,
          nutritionistSummery: find.nutritionistSummery,
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
          gender: find['MemberAssessmentGender'] ? find['MemberAssessmentGender']['gender'] : null,
          maritalStatus: find['MemberAssessmentMaritalStatus']
            ? find['MemberAssessmentMaritalStatus']['maritalStatus']
            : null,
          religion: find['MemberAssessmentReligion'] ? find['MemberAssessmentReligion']['religion'] : null,
          lifestyle: find['MemberAssessmentLifestyle'] ? find['MemberAssessmentLifestyle']['lifestyle'] : null,
          eatingHabit: find['MemberAssessmentEatingHabit'] ? find['MemberAssessmentEatingHabit']['eatingHabit'] : null,
          typeOfExercise: find['MemberAssessmentTypeOfExercise']
            ? find['MemberAssessmentTypeOfExercise']['typeOfExercise']
            : null,
          sleepingPattern: find['MemberAssessmentSleepingPattern']
            ? find['MemberAssessmentSleepingPattern']['sleepingPattern']
            : null,
          bloodSugar: find['MemberAssessmentBloodSugar'] ? find['MemberAssessmentBloodSugar']['bloodSugar'] : null,
          urineOutput: find['MemberAssessmentUrineOutput'] ? find['MemberAssessmentUrineOutput']['urineOutput'] : null,
        };

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async createOrUpdate(
    memberId: number,
    obj: CreateMemberAssessmentDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    const t = await this.sequelize.transaction();
    try {
      const dbObj = {
        memberId: memberId,
        dateOfBirth: obj.dateOfBirth ? moment(obj.dateOfBirth, DB_DATE_FORMAT) : null,
        age: obj.age ? obj.age : null,
        genderId: obj.genderId ? obj.genderId : null,
        maritalStatusId: obj.maritalStatusId ? obj.maritalStatusId : null,
        religionId: obj.religionId ? obj.religionId : null,
        lifestyleId: obj.lifestyleId ? obj.lifestyleId : null,
        eatingHabitId: obj.eatingHabitId ? obj.eatingHabitId : null,
        tobaccoAmount: obj.tobaccoAmount ? obj.tobaccoAmount : null,
        tobaccoFrequency: obj.tobaccoFrequency ? obj.tobaccoFrequency : null,
        paan: obj.paan ? obj.paan : null,
        smokingAmount: obj.smokingAmount ? obj.smokingAmount : null,
        smokingFrequency: obj.smokingFrequency ? obj.smokingFrequency : null,
        alcoholDrink: obj.alcoholDrink ? obj.alcoholDrink : null,
        alcoholFrequency: obj.alcoholFrequency ? obj.alcoholFrequency : null,
        alcoholAmount: obj.alcoholAmount ? obj.alcoholAmount : null,
        aeratedDrinks: obj.aeratedDrinks ? obj.aeratedDrinks : null,
        waterIntake: obj.waterIntake ? obj.waterIntake : null,
        religious: obj.religious ? obj.religious : null,
        fasting: obj.fasting ? obj.fasting : null,
        restaurantVisit: obj.restaurantVisit ? obj.restaurantVisit : null,
        preferredCuisine: obj.preferredCuisine ? obj.preferredCuisine : null,
        whoCooks: obj.whoCooks ? obj.whoCooks : null,
        hungerPeak: obj.hungerPeak ? obj.hungerPeak : null,
        foodDislikes: obj.foodDislikes ? obj.foodDislikes : null,
        otherFoodPreferences: obj.otherFoodPreferences ? obj.otherFoodPreferences : null,
        doYouExercise: obj.doYouExercise ? obj.doYouExercise : null,
        typeOfExerciseId: obj.typeOfExerciseId ? obj.typeOfExerciseId : null,
        frequency: obj.frequency ? obj.frequency : null,
        duration: obj.duration ? obj.duration : null,
        time: obj.time ? obj.time : null,
        allergies: obj.allergies ? obj.allergies : null,
        allergySpecify: obj.allergySpecify ? obj.allergySpecify : null,
        sleepingPatternId: obj.sleepingPatternId ? obj.sleepingPatternId : null,
        sleepDuration: obj.sleepDuration ? obj.sleepDuration : null,
        gas: obj.gas ? obj.gas : null,
        hyperAcidity: obj.hyperAcidity ? obj.hyperAcidity : null,
        constipation: obj.constipation ? obj.constipation : null,
        periods: obj.periods ? obj.periods : null,
        lmp: obj.lmp ? obj.lmp : null,
        daysCycle: obj.daysCycle ? obj.daysCycle : null,
        hairFall: obj.hairFall ? obj.hairFall : null,
        kneePain: obj.kneePain ? obj.kneePain : null,
        backPain: obj.backPain ? obj.backPain : null,
        bloodSugarId: obj.bloodSugarId ? obj.bloodSugarId : null,
        bloodSugarValue: obj.bloodSugarValue ? obj.bloodSugarValue : null,
        cholesterol: obj.cholesterol ? obj.cholesterol : null,
        triglycerides: obj.triglycerides ? obj.triglycerides : null,
        hdlCholesterol: obj.hdlCholesterol ? obj.hdlCholesterol : null,
        ldlCholesterol: obj.ldlCholesterol ? obj.ldlCholesterol : null,
        vldlCholesterol: obj.vldlCholesterol ? obj.vldlCholesterol : null,
        hgLevel: obj.hgLevel ? obj.hgLevel : null,
        urineOutputId: obj.urineOutputId ? obj.urineOutputId : null,
        supplementMedicine: obj.supplementMedicine ? obj.supplementMedicine : null,
        wakeupTiming: obj.wakeupTiming ? obj.wakeupTiming : null,
        bfMenu: obj.bfMenu ? obj.bfMenu : null,
        bfTime: obj.bfTime ? obj.bfTime : null,
        mmMenu: obj.mmMenu ? obj.mmMenu : null,
        mmTime: obj.mmTime ? obj.mmTime : null,
        lunchMenu: obj.lunchMenu ? obj.lunchMenu : null,
        lunchTime: obj.lunchTime ? obj.lunchTime : null,
        eveMenu: obj.eveMenu ? obj.eveMenu : null,
        eveTime: obj.eveTime ? obj.eveTime : null,
        midEveMenu: obj.midEveMenu ? obj.midEveMenu : null,
        midEveTime: obj.midEveTime ? obj.midEveTime : null,
        dinnerMenu: obj.dinnerMenu ? obj.dinnerMenu : null,
        dinnerTime: obj.dinnerTime ? obj.dinnerTime : null,
        nightSnacks: obj.nightSnacks ? obj.nightSnacks : null,
        bedTime: obj.bedTime ? obj.bedTime : null,
        fruitsFrequency: obj.fruitsFrequency ? obj.fruitsFrequency : null,
        breakFrequency: obj.breakFrequency ? obj.breakFrequency : null,
        breadAmount: obj.breadAmount ? obj.breadAmount : null,
        sweetFrequency: obj.sweetFrequency ? obj.sweetFrequency : null,
        sweetAmount: obj.sweetAmount ? obj.sweetAmount : null,
        teaFrequency: obj.teaFrequency ? obj.teaFrequency : null,
        teaAmount: obj.teaAmount ? obj.teaAmount : null,
        remark: obj.remark ? obj.remark : null,
        nutritionistSummery: obj.nutritionistSummery ? obj.nutritionistSummery : null,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };

      const checkUser = await this.findOneById(memberId);
      let dbRes;
      if (checkUser) {
        dbRes = await this.updateInDB(memberId, dbObj);
      } else {
        dbObj['createdBy'] = adminId;
        dbObj['createdIp'] = cIp;
        dbRes = await this.createInDB(dbObj);
      }

      if (dbRes) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  private async createInDB(obj: any) {
    return await this.assessmentRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.assessmentRepository
      .update(obj, { where: { memberId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async findOneById(memberId: number): Promise<TxnAssessment | null> {
    return await this.assessmentRepository.findOne<TxnAssessment>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }
}
