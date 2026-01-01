import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnAssessment, TxnMember } from '../models';
import { CommonFunctionsUtil } from '@server/common';
import { IManageMemberAssessment, IMemberAssessment } from '@eatfit247-shared-lib';

@Injectable()
export class MemberAssessmentService {
  constructor(
    @InjectModel(TxnAssessment)
    private readonly assessmentRepository: typeof TxnAssessment,
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Get assessment for a member
   * @param memberId - Member ID
   * @returns Member assessment or null
   */
  public async findByMemberId(memberId: number): Promise<IMemberAssessment | null> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Fetch assessment with relationships
    const record = await this.assessmentRepository.scope('details').findOne({
      where: { memberId },
      raw: false,
      nest: true,
    });

    if (!record) {
      return null;
    }

    return this.convertToModel(record);
  }

  /**
   * Create or update assessment for a member
   * @param memberId - Member ID
   * @param obj - Assessment data
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   */
  public async createOrUpdate(
    memberId: number,
    obj: IManageMemberAssessment,
    requestedIp: string,
    adminId: number,
  ): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const t = await this.sequelize.transaction();
    try {
      const existing = await this.assessmentRepository.findOne({
        where: { memberId },
        transaction: t,
      });

      const dbObj: any = {
        memberId,
        dateOfBirth: obj.dateOfBirth ? new Date(obj.dateOfBirth) : null,
        age: obj.age || null,
        genderId: obj.genderId,
        maritalStatusId: obj.maritalStatusId,
        religionId: obj.religionId,
        lifestyleId: obj.lifestyleId,
        eatingHabitId: obj.eatingHabitId,
        tobaccoAmount: obj.tobaccoAmount || null,
        tobaccoFrequency: obj.tobaccoFrequency || null,
        paan: obj.paan || null,
        smokingAmount: obj.smokingAmount || null,
        smokingFrequency: obj.smokingFrequency || null,
        alcoholDrink: obj.alcoholDrink || null,
        alcoholFrequency: obj.alcoholFrequency || null,
        alcoholAmount: obj.alcoholAmount || null,
        aeratedDrinks: obj.aeratedDrinks || null,
        waterIntake: obj.waterIntake || null,
        religious: obj.religious || null,
        fasting: obj.fasting || null,
        restaurantVisit: obj.restaurantVisit || null,
        preferredCuisine: obj.preferredCuisine || null,
        whoCooks: obj.whoCooks || null,
        hungerPeak: obj.hungerPeak || null,
        foodDislikes: obj.foodDislikes || null,
        otherFoodPreferences: obj.otherFoodPreferences || null,
        doYouExercise: obj.doYouExercise || null,
        typeOfExerciseId: obj.typeOfExerciseId || null,
        frequency: obj.frequency || null,
        duration: obj.duration || null,
        time: obj.time || null,
        allergies: obj.allergies || null,
        allergySpecify: obj.allergySpecify || null,
        sleepingPatternId: obj.sleepingPatternId,
        sleepDuration: obj.sleepDuration || null,
        gas: obj.gas || null,
        hyperAcidity: obj.hyperAcidity || null,
        constipation: obj.constipation || null,
        periods: obj.periods || null,
        lmp: obj.lmp || null,
        daysCycle: obj.daysCycle || null,
        hairFall: obj.hairFall || null,
        kneePain: obj.kneePain || null,
        backPain: obj.backPain || null,
        bloodSugarId: obj.bloodSugarId || null,
        bloodSugarValue: obj.bloodSugarValue || null,
        cholesterol: obj.cholesterol || null,
        triglycerides: obj.triglycerides || null,
        hdlCholesterol: obj.hdlCholesterol || null,
        ldlCholesterol: obj.ldlCholesterol || null,
        vldlCholesterol: obj.vldlCholesterol || null,
        hgLevel: obj.hgLevel || null,
        urineOutputId: obj.urineOutputId || null,
        supplementMedicine: obj.supplementMedicine || null,
        wakeupTiming: obj.wakeupTiming || null,
        bfMenu: obj.bfMenu || null,
        bfTime: obj.bfTime || null,
        mmMenu: obj.mmMenu || null,
        mmTime: obj.mmTime || null,
        lunchMenu: obj.lunchMenu || null,
        lunchTime: obj.lunchTime || null,
        eveMenu: obj.eveMenu || null,
        eveTime: obj.eveTime || null,
        midEveMenu: obj.midEveMenu || null,
        midEveTime: obj.midEveTime || null,
        dinnerMenu: obj.dinnerMenu || null,
        dinnerTime: obj.dinnerTime || null,
        nightSnacks: obj.nightSnacks || null,
        bedTime: obj.bedTime || null,
        fruitsFrequency: obj.fruitsFrequency || null,
        breakFrequency: obj.breakFrequency || null,
        breadAmount: obj.breadAmount || null,
        sweetFrequency: obj.sweetFrequency || null,
        sweetAmount: obj.sweetAmount || null,
        teaFrequency: obj.teaFrequency || null,
        teaAmount: obj.teaAmount || null,
        remark: obj.remark || null,
        nutritionistSummery: obj.nutritionistSummery || null,
        modifiedBy: adminId,
        modifiedIp: requestedIp,
      };

      if (existing) {
        await this.assessmentRepository.update(dbObj, {
          where: { memberId },
          transaction: t,
        });
      } else {
        dbObj.createdBy = adminId;
        dbObj.createdIp = requestedIp;
        await this.assessmentRepository.create(dbObj, { transaction: t });
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  private convertToModel(item: TxnAssessment): IMemberAssessment {
    return {
      assessmentId: item.assessmentId,
      memberId: item.memberId,
      dateOfBirth: item.dateOfBirth,
      age: item.age,
      genderId: item.genderId,
      maritalStatusId: item.maritalStatusId,
      religionId: item.religionId,
      lifestyleId: item.lifestyleId,
      eatingHabitId: item.eatingHabitId,
      tobaccoAmount: item.tobaccoAmount,
      tobaccoFrequency: item.tobaccoFrequency,
      paan: item.paan,
      smokingAmount: item.smokingAmount,
      smokingFrequency: item.smokingFrequency,
      alcoholDrink: item.alcoholDrink,
      alcoholFrequency: item.alcoholFrequency,
      alcoholAmount: item.alcoholAmount,
      aeratedDrinks: item.aeratedDrinks,
      waterIntake: item.waterIntake,
      religious: item.religious,
      fasting: item.fasting,
      restaurantVisit: item.restaurantVisit,
      preferredCuisine: item.preferredCuisine,
      whoCooks: item.whoCooks,
      hungerPeak: item.hungerPeak,
      foodDislikes: item.foodDislikes,
      otherFoodPreferences: item.otherFoodPreferences,
      doYouExercise: item.doYouExercise,
      typeOfExerciseId: item.typeOfExerciseId,
      frequency: item.frequency,
      duration: item.duration,
      time: item.time,
      allergies: item.allergies,
      allergySpecify: item.allergySpecify,
      sleepingPatternId: item.sleepingPatternId,
      sleepDuration: item.sleepDuration,
      gas: item.gas,
      hyperAcidity: item.hyperAcidity,
      constipation: item.constipation,
      periods: item.periods,
      lmp: item.lmp,
      daysCycle: item.daysCycle,
      hairFall: item.hairFall,
      kneePain: item.kneePain,
      backPain: item.backPain,
      bloodSugarId: item.bloodSugarId,
      bloodSugarValue: item.bloodSugarValue,
      cholesterol: item.cholesterol,
      triglycerides: item.triglycerides,
      hdlCholesterol: item.hdlCholesterol,
      ldlCholesterol: item.ldlCholesterol,
      vldlCholesterol: item.vldlCholesterol,
      hgLevel: item.hgLevel,
      urineOutputId: item.urineOutputId,
      supplementMedicine: item.supplementMedicine,
      wakeupTiming: item.wakeupTiming,
      bfMenu: item.bfMenu,
      bfTime: item.bfTime,
      mmMenu: item.mmMenu,
      mmTime: item.mmTime,
      lunchMenu: item.lunchMenu,
      lunchTime: item.lunchTime,
      eveMenu: item.eveMenu,
      eveTime: item.eveTime,
      midEveMenu: item.midEveMenu,
      midEveTime: item.midEveTime,
      dinnerMenu: item.dinnerMenu,
      dinnerTime: item.dinnerTime,
      nightSnacks: item.nightSnacks,
      bedTime: item.bedTime,
      fruitsFrequency: item.fruitsFrequency,
      breakFrequency: item.breakFrequency,
      breadAmount: item.breadAmount,
      sweetFrequency: item.sweetFrequency,
      sweetAmount: item.sweetAmount,
      teaFrequency: item.teaFrequency,
      teaAmount: item.teaAmount,
      remark: item.remark,
      nutritionistSummery: item.nutritionistSummery,
      gender: item.gender?.gender || null,
      maritalStatus: item.maritalStatus?.maritalStatus || null,
      religion: item.religion?.religion || null,
      lifestyle: item.lifestyle?.lifestyle || null,
      eatingHabit: item.eatingHabit?.eatingHabit || null,
      typeOfExercise: item.typeOfExercise?.typeOfExercise || null,
      sleepingPattern: item.sleepingPattern?.sleepingPattern || null,
      bloodSugar: item.bloodSugar?.bloodSugar || null,
      urineOutput: item.urineOutput?.urineOutput || null,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }
}
