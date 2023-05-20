import { InjectModel } from '@nestjs/sequelize';
import { Controller, Get } from '@nestjs/common';
import { TxnMember } from '../../core/database/models/txn-member.model';
import { TxnAddress } from 'src/core/database/models/txn-address.model';
import { TxnMemberPocketGuide } from 'src/core/database/models/txn-member-pocket-guide.model';
import { TxnMemberDietPlan } from 'src/core/database/models/txn-member-diet-plan.model';
import { TxnMemberPayment } from 'src/core/database/models/txn-member-payment.model';
import { TxnMemberDietPlanDetail } from 'src/core/database/models/txn-member-diet-plan-detail.model';
import { MstRecipeCategory } from 'src/core/database/models/mst-recipe-category.model';
import { MstCountries } from 'src/core/database/models/mst-countries.model';
import { MstState } from 'src/core/database/models/mst-state.model';
import { Sequelize } from 'sequelize-typescript';
import { MstProgram } from 'src/core/database/models/mst-program.model';
import { MstPaymentMode } from 'src/core/database/models/mst-payment-mode.model';
import { MstProgramPlan } from 'src/core/database/models/mst-program-plan.model';
import { TxnAssessment } from 'src/core/database/models/txn-assessment.model';
import { TxnMemberHealthIssue } from 'src/core/database/models/txn-member-health-issue.model';
import { TxnMemberHealthParameter } from 'src/core/database/models/txn-member-health-parameter.model';
import { UserStatusEnum } from 'src/enums/user-status-enum';
import { MstHealthParameter } from 'src/core/database/models/mst-health-parameter.model';
import { MstHealthParameterUnit } from 'src/core/database/models/mst-health-parameter-unit.model';
import { TxnMemberHealthParameterLog } from 'src/core/database/models/txn-member-health-parameter-log.model';
import { TableEnum } from '../../enums/table-enum';
import { AddressTypeEnum } from '../../enums/address-type-enum';
import { DB_DATE_FORMAT, IN_COUNTRY_ID, PRIMARY_FRANCHISE } from '../../constants/config-constants';
import * as _ from 'lodash';
import { filter, find, uniq } from 'lodash';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DEFAULT_CURRENCY, TAX_PERCENTAGE } from '../../constants/config-parameters';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import { CurrencyService } from '../lov/services/currency.service';
import { CommonService } from '../common/common.service';
import { exit } from '@nestjs/cli/actions';
import * as moment from 'moment';
import { DietTypeEnum } from '../../enums/diet-type-enum';
import { MstConfig } from '../../core/database/models/mst-config.model';

@Controller('migration')
export class MemberMigrationController {
  folderPath = '/Users/mahendraparihar/Projects/EatFit247/Migration';

  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnAddress) private readonly memberAddressRepository: typeof TxnAddress,
    @InjectModel(TxnMemberPocketGuide) private readonly pocketGuideRepository: typeof TxnMemberPocketGuide,
    @InjectModel(TxnMemberPayment) private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberDietPlan) private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietPlanDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietPlanDetail,
    @InjectModel(MstRecipeCategory) private readonly recipeCategoryRepository: typeof MstRecipeCategory,
    @InjectModel(MstCountries) private readonly countryRepository: typeof MstCountries,
    @InjectModel(MstState) private readonly stateRepository: typeof MstState,
    @InjectModel(MstProgram) private readonly programRepository: typeof MstProgram,
    @InjectModel(MstProgramPlan) private readonly programPlanRepository: typeof MstProgramPlan,
    @InjectModel(MstPaymentMode) private readonly paymentModeRepository: typeof MstPaymentMode,
    @InjectModel(TxnAssessment) private readonly assessmentRepository: typeof TxnAssessment,
    @InjectModel(MstHealthParameter) private readonly healthParamRepository: typeof MstHealthParameter,
    @InjectModel(MstHealthParameterUnit) private readonly healthParamUnitRepository: typeof MstHealthParameterUnit,
    @InjectModel(TxnMemberHealthIssue) private readonly memberHealthIssueRepository: typeof TxnMemberHealthIssue,
    @InjectModel(TxnMemberHealthParameter)
    private readonly memberHealthParamRepository: typeof TxnMemberHealthParameter,
    @InjectModel(TxnMemberHealthParameterLog)
    private readonly memberHealthParamLogRepository: typeof TxnMemberHealthParameterLog,
    private sequelize: Sequelize,
    private configParameterService: ConfigParameterService,
    private currencyConfigService: CurrencyService,
    private commonService: CommonService,
  ) {
  }

  @Get('member')
  async init() {
    const t = await this.sequelize.transaction();

    try {
      // Program Plan
      // try {
      //   await this.createProgramPlan();
      // } catch (e) {
      //   console.log(e);
      //   await t.rollback();
      //   exit();
      // }

      // Member
      // try {
      //   await this.createMemberData();
      // } catch (e) {
      //   await t.rollback();
      //   exit();
      // }

      // Member health issues
      // try {
      //   await this.createMemberHealthIssues();
      // } catch (e) {
      //   await t.rollback();
      //   exit();
      // }

      // Member pocket guide
      // try {
      //   await this.createMemberPocketGuide();
      // } catch (e) {
      //   await t.rollback();
      //   exit();
      // }

      // Member Assessment
      // try {
      //   await this.createMemberAssessment();
      // } catch (e) {
      //   await t.rollback();
      //   exit();
      // }
      //
      // // Member Health Parameter
      // try {
      //   await this.createMemberHealthParameter();
      // } catch (e) {
      //   await t.rollback();
      //   exit();
      // }

      // Member Address
      // try {
      //   await this.createMemberAddress();
      // } catch (e) {
      //   console.log(e);
      //   await t.rollback();
      //   exit();
      // }

      // Member Program Plan
      // try {
      //   await this.createMemberProgramPlan();
      // } catch (e) {
      //   console.log(e);
      //   await t.rollback();
      //   exit();
      // }

      //Member Diet Plan
      // try {
      //   await this.createMemberDietPlan();
      // } catch (error) {
      //   console.log(error);
      //   await t.rollback();
      //   exit();
      // }
      await t.commit();
    } catch (e) {
      console.log(e);
      await t.rollback();
      throw e;
    }
  }

  getStateId(state: string, countryId: number, stateList: MstState[]) {
    const maharashtraStateId = 27;
    const countryStateList: MstState[] = filter(stateList, (x: MstState) => {
      return x.countryId === countryId;
    });
    if (countryStateList && countryStateList.length > 0) {
      const countryState = find(countryStateList, (x: MstState) => {
        return x.state.toLowerCase() === state.toLowerCase();
      });
      return countryState ? countryState.stateId : countryStateList[0].stateId;
    } else {
      return maharashtraStateId;
    }
  }

  async getAllRecipeCategories() {
    return await this.recipeCategoryRepository.findAll<MstRecipeCategory>({
      attributes: ['recipeCategoryId', 'recipeCategory'],
      raw: true,
      nest: true,
    });
  }

  async getAddresses() {
    return await this.memberAddressRepository.findAll<TxnAddress>({
      attributes: ['addressId', 'pkOfTable', 'tableId'],
      raw: true,
      nest: true,
    });
  }

  private async calculateFees(
    programPlan: MstProgramPlan,
    userCurrencys: string,
    isTaxApplicable: boolean,
    systemDiscountAmount: number,
    address: TxnAddress,
    oldTaxObject: any,
  ) {
    try {
      const planFees = programPlan;
      const configParameters: MstConfig[] = (await this.configParameterService.findAll()).data;
      const currencyConfigList = await this.currencyConfigService.getCurrencyConfigList();
      const franchiseAddresses = await this.commonService.findAddresses(TableEnum.MST_FRANCHISE, PRIMARY_FRANCHISE);
      let franchiseAddress;
      if (franchiseAddresses && franchiseAddresses.length > 0) {
        franchiseAddress = franchiseAddresses[0];
      }
      const tempUC = _.find(configParameters, { configName: DEFAULT_CURRENCY });
      const userCurrency = tempUC.configValue;

      const tempSC = _.find(configParameters, { configName: DEFAULT_CURRENCY });
      const systemCurrency = tempSC.configValue;

      const taxApplicable = isTaxApplicable;

      const tempTP = _.find(configParameters, { configName: TAX_PERCENTAGE });
      const taxPercentage = Number(tempTP.configValue);

      const targetCurrencyConfig = _.find(currencyConfigList, {
        sourceCurrencyCode: userCurrency,
      });

      const systemCurrencyOrderAmount = Number(planFees.inrAmount);
      const systemCurrencyDiscountAmount = Number(systemDiscountAmount ? systemDiscountAmount : 0);
      const systemCurrencyTaxAmount = taxApplicable
        ? ((systemCurrencyOrderAmount - systemCurrencyDiscountAmount) * taxPercentage) / 100
        : 0;
      const systemCurrencyTotalAmount =
        systemCurrencyOrderAmount - systemCurrencyDiscountAmount + systemCurrencyTaxAmount;
      const userCurrencyOrderAmount = this.convertAmount(
        systemCurrencyOrderAmount,
        targetCurrencyConfig.conversionRate,
        targetCurrencyConfig.conversionRateFeesInPercent,
      );
      const userCurrencyDiscountAmount = this.convertAmount(
        systemCurrencyDiscountAmount,
        targetCurrencyConfig.conversionRate,
        targetCurrencyConfig.conversionRateFeesInPercent,
      );
      const userCurrencyTaxAmount = taxApplicable
        ? ((userCurrencyOrderAmount - userCurrencyDiscountAmount) * taxPercentage) / 100
        : 0;
      const userCurrencyTotalAmount = userCurrencyOrderAmount - userCurrencyDiscountAmount + userCurrencyTaxAmount;
      let userTaxObj = null;
      let systemTaxObj = null;
      if (isTaxApplicable) {
        systemTaxObj = this.calcTaxObj(
          address.countryId,
          address.stateId,
          franchiseAddress.countryId,
          franchiseAddress.stateId,
          systemCurrencyTaxAmount,
          taxPercentage,
        );
        userTaxObj = this.calcTaxObj(
          address.countryId,
          address.stateId,
          franchiseAddress.countryId,
          franchiseAddress.stateId,
          userCurrencyTaxAmount,
          taxPercentage,
        );
      }
      return {
        user: {
          orderAmount: userCurrencyOrderAmount,
          discountAmount: userCurrencyDiscountAmount,
          taxAmount: userCurrencyTaxAmount,
          totalAmount: userCurrencyTotalAmount,
          currency: userCurrency,
          taxObj: userTaxObj,
        },
        system: {
          orderAmount: systemCurrencyOrderAmount,
          discountAmount: systemCurrencyDiscountAmount,
          taxAmount: systemCurrencyTaxAmount,
          totalAmount: systemCurrencyTotalAmount,
          currency: systemCurrency,
          taxObj: systemTaxObj,
        },
        taxPercentage: taxPercentage,
      };
    } catch (e) {
      throw e;
    }
  }

  private calcTaxObj(clientCountryId, clientStateId, businessCountryId, businessStateId, amount, taxPercentage) {
    if (businessCountryId === IN_COUNTRY_ID && clientCountryId === IN_COUNTRY_ID) {
      if (clientStateId === businessStateId) {
        // SGST and CGST
        return {
          SGST: { taxPercentage: taxPercentage / 2, amount: amount / 2 },
          CGST: { taxPercentage: taxPercentage / 2, amount: amount / 2 },
        };
      } else {
        // IGST
        return {
          IGST: { taxPercentage: taxPercentage, amount: amount },
        };
      }
    } else {
      // IGST
      return {
        IGST: { taxPercentage: taxPercentage, amount: amount },
      };
    }
  }

  private convertAmount(primaryAmount: number, conversionRate: number, conversionFees: number): number {
    return primaryAmount / conversionRate;
  }

  private async getAllCountries() {
    return await this.countryRepository.findAll<MstCountries>({
      attributes: ['countryId', 'country', 'countryCode', 'phoneNumberCode'],
      raw: true,
      nest: true,
    });
  }

  private async getAllStates() {
    return await this.stateRepository.findAll<MstState>({
      attributes: ['stateId', 'state'],
      raw: true,
      nest: true,
    });
  }

  private async getAllPrograms() {
    return await this.programRepository.findAll<MstProgram>({
      attributes: ['programId', 'program'],
      raw: true,
      nest: true,
    });
  }

  private async getAllProgramPlans() {
    return await this.programPlanRepository.findAll<MstProgramPlan>({
      attributes: ['programPlanId', 'inrAmount', 'noOfCycle'],
      raw: true,
      nest: true,
    });
  }

  private async getAllPaymentModes() {
    return await this.paymentModeRepository.findAll<MstPaymentMode>({
      attributes: ['paymentModeId', 'paymentMode'],
      raw: true,
      nest: true,
    });
  }

  private async getAllHealthParams() {
    return await this.healthParamRepository.findAll<MstHealthParameter>({
      attributes: ['paymentModeId', 'paymentMode'],
      raw: true,
      nest: true,
    });
  }

  private async getAllHealthParamUnits() {
    return await this.healthParamUnitRepository.findAll<MstHealthParameterUnit>({
      attributes: ['healthParameterUnitId', 'healthParameterUnit'],
      raw: true,
      nest: true,
    });
  }

  private async deleteExistingData() {
    await this.sequelize.query(`
    truncate table txn_member_issue_responses restart identity CASCADE;
    truncate table txn_member_issues restart identity CASCADE;
    truncate table txn_member_diet_plans restart identity CASCADE;
    truncate table txn_member_diet_details restart identity CASCADE;
    truncate table txn_addresses restart identity CASCADE;
    truncate table txn_member_payments restart identity CASCADE;
    truncate table txn_member_call_logs restart identity CASCADE;
    truncate table txn_member_health_parameters restart identity CASCADE;
    truncate table txn_member_health_parameter_logs restart identity CASCADE;
    truncate table mst_program_plans restart identity CASCADE;
    `);
  }

  private replaceExtraChar(tempText: string): string {
    if (tempText) {
      tempText = tempText.replace('<br>', '');
      tempText = tempText.replace('<br/>', '');
      tempText = tempText.replace('</br>', '');
      return tempText;
    } else {
      return '';
    }
  }

  private async createMemberData() {
    try {
      const adminUserId = 1;
      const memberV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/mst_member.json`), 'utf8'));
      const dietPlanV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_diet_plan.json`), 'utf8'));
      const countryList = await this.getAllCountries();
      const memberList = [];
      let nutriId;
      for (const s of memberV1List) {
        //MEMBER
        nutriId = dietPlanV1List.find((x) => x.member_id === s.id)?.nutritionist_id;
        memberList.push({
          memberId: Number(s.id),
          firstName: s.first_name,
          lastName: s.last_name,
          profilePicture: null,
          password: s.password,
          passwordTemp: s.password,
          countryCode: countryList.find((x) => x.countryId == s.country_id)?.phoneNumberCode || '+91',
          contactNumber: s.phone_number.split('/')[0].substring(0, 16),
          emailId: s.email_id,
          userStatusId: s.active == 2 ? UserStatusEnum.VERIFICATION_PENDING : s.active,
          deactivationReason: s.deactive_reason,
          hasAnyPlan: false,
          franchiseId: 1,
          nutritionistId: nutriId > 0 ? nutriId : null,
          referrerId: s.referrer_id > 0 ? s.referrer_id : null,
          countryId: s.country_id || 96,
          createdAt: s.created_at,
          createdBy: s.created_by > 0 ? s.created_by : adminUserId,
          updatedAt: s.updated_at,
          modifiedBy: s.modified_by > 0 ? s.modified_by : adminUserId,
          createdIp: s.created_ip ? s.created_ip : ':0',
          modifiedIp: s.updated_ip ? s.updated_ip : s.created_ip ? s.created_ip : ':0',
        });
      }

      await this.sequelize.query(`truncate table txn_members restart identity CASCADE;`);

      let tempList = [];
      for (let i = 0; i < memberList.length; i++) {
        tempList.push(memberList[i]);
        if (tempList.length === 100) {
          await this.memberRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.memberRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_members_member_id_seq', (SELECT MAX(member_id) + 1 FROM txn_members));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createMemberHealthIssues() {
    try {
      const adminUserId = 1;
      const memberV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/mst_member.json`), 'utf8'));
      const memberHealthIssueList = [];
      for (const s of memberV1List) {
        //HEALTH
        if (s.health_issue_id && Number(s.health_issue_id) > 0) {
          memberHealthIssueList.push({
            memberId: s.id,
            healthIssueId: s.health_issue_id,
            createdAt: s.created_at,
            createdBy: s.created_by > 0 ? s.created_by : adminUserId,
            updatedAt: s.updated_at,
            modifiedBy: s.modified_by > 0 ? s.modified_by : adminUserId,
            createdIp: s.created_ip ? s.created_ip : ':0',
            modifiedIp: s.updated_ip ? s.updated_ip : s.created_ip ? s.created_ip : ':0',
          });
        }
      }

      await this.sequelize.query(`truncate table txn_member_health_issues restart identity CASCADE;`);

      let tempHealthIssueList = [];
      for (let i = 0; i < memberHealthIssueList.length; i++) {
        tempHealthIssueList.push(memberHealthIssueList[i]);
        if (tempHealthIssueList.length === 100) {
          await this.memberHealthIssueRepository.bulkCreate(tempHealthIssueList);
          tempHealthIssueList = [];
        }
      }
      await this.memberHealthIssueRepository.bulkCreate(tempHealthIssueList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_member_health_issues_member_health_issue_id_seq',
                       (SELECT MAX(member_health_issue_id) + 1 FROM txn_member_health_issues));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createMemberPocketGuide() {
    try {
      const adminUserId = 1;
      const memberPocketGuideList = [];
      const pocketGuideV1List = JSON.parse(
        readFileSync(resolve(`${this.folderPath}/txn_member_pocket_guide.json`), 'utf8'),
      );

      for (const s of pocketGuideV1List) {
        if (!memberPocketGuideList.find((x) => x.memberId === s.member_id && x.pocketGuideId == s.pocket_guide_id)) {
          memberPocketGuideList.push({
            memberId: s.member_id,
            pocketGuideId: s.pocket_guide_id,
            createdAt: s.created_at,
            createdBy: s.created_by > 0 ? s.created_by : adminUserId,
            updatedAt: s.updated_at,
            modifiedBy: s.modified_by > 0 ? s.modified_by : adminUserId,
            createdIp: ':0',
            modifiedIp: ':0',
          });
        }
      }

      await this.sequelize.query(`truncate table txn_member_pocket_guides restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < memberPocketGuideList.length; i++) {
        tempList.push(memberPocketGuideList[i]);
        if (tempList.length === 100) {
          await this.pocketGuideRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.pocketGuideRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_member_pocket_guides_member_pocket_guide_id_seq',
                       (SELECT MAX(member_pocket_guide_id) + 1 FROM txn_member_pocket_guides));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createMemberAssessment() {
    try {
      const adminUserId = 1;
      const memberAssessmentList = [];
      const assessmentV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/mst_assessment.json`), 'utf8'));

      for (const item of assessmentV1List) {
        memberAssessmentList.push({
          assessmentId: Number(item.id),
          memberId: item.member_id,
          aeratedDrinks: item.aerated_drinks,
          age: item.age ? Math.floor(item.age) : item.age,
          alcoholAmount: item.alcohol_amount,
          alcoholDrink: item.alcohol_drink,
          alcoholFrequency: item.alcohol_frequency,
          allergies: item.allergies,
          allergySpecify: item.allergy_specify,
          backPain: item.back_pain,
          bedTime: item.bed_time,
          bfMenu: item.bf_menu,
          bfTime: item.bf_time,
          bloodSugarId: item.blood_sugar_id == 0 ? null : item.blood_sugar_id,
          bloodSugarValue: item.blood_sugar_value,
          breadAmount: item.bread_amount,
          breakFrequency: item.break_frequency,
          cholesterol: item.cholestrol,
          constipation: item.constipation,
          dateOfBirth: null, // wrong value in proditem.date_of_birth,
          daysCycle: item.days_cycle,
          dinnerMenu: item.dinner_menu,
          dinnerTime: item.dinner_time,
          doYouExercise: item.do_you_exercise,
          duration: item.duration,
          eatingHabitId: !item.eating_habits_id || item.eating_habits_id == 0 ? 1 : item.eating_habits_id,
          eveMenu: item.eve_menu,
          eveTime: item.eve_time,
          fasting: item.fasting,
          foodDislikes: item.food_dislikes,
          frequency: item.frequency,
          fruitsFrequency: item.fruits_frequency,
          gas: item.gas,
          genderId: !item.gender_id || item.gender_id == 0 ? 1 : item.gender_id,
          hairFall: item.hair_fall,
          hdlCholesterol: item.hdl_cholestrol,
          hgLevel: item.hg_level,
          hungerPeak: item.hunger_peak,
          hyperAcidity: item.hyper_acidity,
          kneePain: item.knee_pain,
          ldlCholesterol: item.ldl_cholestrol,
          lifestyleId: !item.life_style_id || item.life_style_id == 0 ? 1 : item.life_style_id,
          lmp: item.lmp,
          lunchMenu: item.lunch_menu,
          lunchTime: item.lunch_time,
          maritalStatusId: !item.marital_status_id || item.marital_status_id == 0 ? 1 : item.marital_status_id,
          midEveMenu: item.mid_eve_menu,
          midEveTime: item.mid_eve_time,
          mmMenu: item.mm_menu,
          mmTime: item.mm_time,
          nightSnacks: item.night_snacks,
          nutritionistSummery: item.nutritionist_summery,
          otherFoodPreferences: item.other_food_preferences,
          paan: item.paan,
          periods: item.periods,
          preferredCuisine: item.preferred_cuisine,
          religionId: !item.religion_id || item.religion_id == 0 ? 1 : item.religion_id,
          religious: item.religious,
          remark: item.remarks,
          restaurantVisit: item.restaurant_visit,
          sleepDuration: item.sleep_duration,
          sleepingPatternId: item.sleeping_pattern_id == 0 ? null : item.sleeping_pattern_id,
          smokingAmount: item.somking_amount,
          smokingFrequency: item.somking_frequency,
          supplementMedicine: item.supplement_medicine,
          sweetAmount: item.sweet_amount,
          sweetFrequency: item.sweet_frequency,
          teaAmount: item.tea_amount,
          teaFrequency: item.tea_frequency,
          time: item.time,
          tobaccoFrequency: item.tobacco_frequency,
          tobaccoAmount: item.tabacco_amount,
          triglycerides: item.triglycerides,
          typeOfExerciseId: item.type_of_exercise_id == 0 ? null : item.type_of_exercise_id,
          urineOutputId: item.urine_output == 0 ? null : item.urine_output,
          vldlCholesterol: item.vldl_cholestrol,
          wakeupTiming: item.wakeup_timing,
          waterIntake: item.water_intake,
          whoCooks: item.who_cooks,
          createdAt: item.created_at,
          createdBy: item.created_by == 0 ? adminUserId : item.created_by,
          updatedAt: item.updated_at,
          modifiedBy: item.modified_by == 0 ? adminUserId : item.modified_by,
          createdIp: ':0',
          modifiedIp: ':0',
        });
      }

      await this.sequelize.query(`truncate table txn_assessments restart identity CASCADE;`);

      let tempList = [];
      for (let i = 0; i < memberAssessmentList.length; i++) {
        tempList.push(memberAssessmentList[i]);
        if (tempList.length === 100) {
          await this.assessmentRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.assessmentRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_assessments_assessment_id_seq', (SELECT MAX(assessment_id) + 1 FROM txn_assessments));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createMemberAddress() {
    try {
      const adminUserId = 1;

      const countryList = await this.getAllCountries();
      const stateList = await this.getAllStates();

      const memberAddressList = [];
      let countryId;
      const addressV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_member_address.json`), 'utf8'));

      for (const s of addressV1List) {
        countryId = countryList.find((x) => x.country?.toLowerCase() === s.country?.toLowerCase())?.countryId || 96;
        memberAddressList.push({
          tableId: TableEnum.TXN_MEMBER,
          pkOfTable: s.member_id,
          addressTypeId: AddressTypeEnum.PERMANENT_ADDRESS,
          postalAddress: s.postal_addess || s.city,
          cityVillage: s.city || '',
          countryId: s.country_id,
          stateId: this.getStateId(s.state, countryId, stateList),
          pinCode: s.pin_code,
          active: s.active,
          createdAt: s.created_at,
          createdBy: adminUserId, // ID is wrong in prod it is 174
          updatedAt: s.updated_at,
          modifiedBy: adminUserId, // ID is wrong in prod it is 174
          createdIp: ':0',
          modifiedIp: ':0',
        });
      }

      //Member Plan
      const memberPlanV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_member_plan.json`), 'utf8'));

      for (const s of memberPlanV1List) {
        //CREATED BY = 1 here as entries made by member and cant not put member id as it is FK with admin table
        if (s.address_field) {
          countryId = s.address_field.country_id || IN_COUNTRY_ID;

          memberAddressList.push({
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: s.member_id,
            addressTypeId: AddressTypeEnum.PERMANENT_ADDRESS,
            postalAddress: s.address_field.postal_addess || s.city || ' ',
            cityVillage: s.address_field.city || ' ',
            countryId: countryId,
            stateId: this.getStateId(s.address_field.state, countryId, stateList),
            pinCode: s.address_field.pin_code || ' ',
            active: s.active,
            createdAt: s.created_at,
            createdBy: adminUserId,
            updatedAt: s.updated_at,
            modifiedBy: adminUserId,
            createdIp: ':0',
            modifiedIp: ':0',
          });
        } else {
          const m = await this.memberRepository.findOne({ where: { memberId: Number(s.member_id) } });
          memberAddressList.push({
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: s.member_id,
            addressTypeId: AddressTypeEnum.PERMANENT_ADDRESS,
            postalAddress: ' ',
            cityVillage: ' ',
            countryId: m.countryId,
            stateId: this.getStateId('', m.countryId, stateList),
            pinCode: ' ',
            active: s.active,
            createdAt: s.created_at,
            createdBy: adminUserId,
            updatedAt: s.updated_at,
            modifiedBy: adminUserId,
            createdIp: ':0',
            modifiedIp: ':0',
          });
        }
      }

      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_member_plan.json`), 'utf8'));
      for (const s of tempV1List) {
        const address =
          await this.findMemberAddress(
            Number(s.member_id),
            s.created_at,
            s.updated_at,
            s.created_by == 0 ? adminUserId : s.created_by,
            s.modified_by == 0 ? adminUserId : s.modified_by,
          );
        if (address) {
          memberAddressList.push(address);
        }
      }

      await this.sequelize.query(`delete
                                  from txn_addresses
                                  where table_id = ${TableEnum.TXN_MEMBER};`);

      let tempList = [];
      for (let i = 0; i < memberAddressList.length; i++) {
        tempList.push(memberAddressList[i]);
        if (tempList.length === 100) {
          await this.memberAddressRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.memberAddressRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_addresses_address_id_seq', (SELECT MAX(address_id) + 1 FROM txn_addresses));`,
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  private async createProgramPlan() {
    try {
      const adminUserId = 1;
      let planName;
      const insertList = [];
      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/mst_program_plan.json`), 'utf8'));
      let seq = 1;
      for (const pln of tempV1List) {
        planName = `${pln.no_of_week} Weeks Plan`;
        insertList.push({
          plan: planName,
          url: planName.replace('', '_'),
          details: `${pln.no_of_week} Weeks Plan`,
          tags: `${pln.no_of_week} Weeks Plan`,
          sequenceNumber: seq,
          noOfCycle: Number(pln.no_of_week),
          noOfDaysInCycle: 7,
          inrAmount: pln.amount,
          programPlanTypeId: 1,
          isOnline: pln.week_text === 'WEEK-ONLINE' ? true : false,
          isVisibleOnWeb: false,
          active: pln.active,
          createdAt: pln.created_at,
          createdBy: adminUserId,
          updatedAt: pln.updated_at,
          modifiedBy: adminUserId,
          createdIp: ':0',
          modifiedIp: ':0',
        });
        seq++;
      }

      await this.sequelize.query(`truncate table mst_program_plans restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < insertList.length; i++) {
        tempList.push(insertList[i]);
        if (tempList.length === 100) {
          await this.programPlanRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.programPlanRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('mst_program_plans_program_plan_id_seq',
                       (SELECT MAX(program_plan_id) + 1 FROM mst_program_plans));`,
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async findMemberAddress(
    memberId: number,
    created_at: Date,
    updated_at: Date,
    createdBy: number,
    updatedBy: number,
  ) {
    const memberAddressList: TxnAddress[] = await this.memberAddressRepository.findAll({
      raw: true,
      nest: true,
      where: { tableId: TableEnum.TXN_MEMBER, pkOfTable: memberId },
    });
    if (memberAddressList && memberAddressList.length === 0) {
      return null;
    }
    const member = await this.memberRepository.findOne({ where: { memberId: memberId }, raw: true, nest: true });
    const whereCondition = { countryId: member.countryId };
    if (member.countryId === IN_COUNTRY_ID) {
      whereCondition['stateId'] = 27;
    }
    console.log(member);
    console.log(whereCondition);
    const state = await this.stateRepository.findOne({
      where: whereCondition,
      nest: true,
      raw: true,
    });
    return {
      tableId: TableEnum.TXN_MEMBER,
      pkOfTable: memberId,
      addressTypeId: AddressTypeEnum.PERMANENT_ADDRESS,
      postalAddress: state.state,
      cityVillage: state.state,
      countryId: state.countryId,
      stateId: state.stateId,
      pinCode: '',
      active: true,
      createdAt: created_at,
      createdBy: createdBy,
      updatedAt: updated_at,
      modifiedBy: updatedBy,
      createdIp: ':0',
      modifiedIp: ':0',
    };
  }

  private async createMemberProgramPlan() {
    try {
      const adminUserId = 1;
      const insertList = [];
      const programPlanPlan: MstProgramPlan[] = await this.programPlanRepository.findAll({ raw: true, nest: true });
      const paymentModeList: MstPaymentMode[] = await this.paymentModeRepository.findAll({ raw: true, nest: true });
      const memberAddresses: TxnAddress[] = await this.memberAddressRepository.findAll({
        raw: true,
        nest: true,
        where: { tableId: TableEnum.TXN_MEMBER },
      });
      const tempV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_member_plan.json`), 'utf8'));
      const tempV1PlanList = JSON.parse(
        readFileSync(resolve(`${this.folderPath}/original_mst_program_plan.json`), 'utf8'),
      );
      for (const s of tempV1List) {
        const address = find(memberAddresses, { pkOfTable: Number(s.member_id) });
        const v1Plan = find(tempV1PlanList, (obj) => {
          return Number(obj.id) === Number(s.program_plan_id);
        });
        console.log(v1Plan);
        const plan: MstProgramPlan = find(programPlanPlan, (obj: MstProgramPlan) => {
          return (
            obj.noOfCycle === Number(v1Plan.no_of_week) &&
            obj.inrAmount === Number(v1Plan.amount) &&
            (obj.isOnline ? 'WEEK-ONLINE' : 'WEEK-PERSONAL') === v1Plan.week_text
          );
        });

        const payObj = {
          memberPaymentId: Number(s.id),
          memberId: Number(s.member_id),
          paymentModeId:
            paymentModeList.find((x) => x.paymentMode.toLowerCase() === s.payment_type?.toLowerCase())?.paymentModeId ||
            14,
          programId: Number(v1Plan.program_id),
          programPlanId: plan.programPlanId,
          addressId: address.addressId,
          transactionId: s.invoice_id ? s.invoice_id : null,
          invoiceId: s.invoice_no || `EF24B7${s.id}`,
          paymentStatusId: (s.payment_status == 'paid' || s.payment_status == 'Success') ? 1 : 2,
          promoCode: s.discount_code,
          paymentDate: s.start_date ? s.start_date : s.created_at,
          paymentGatewayResponse: s.razor_json ? s.razor_json : null,
          paymentObj: await this.calculateFees(
            plan,
            'INR',
            Number(s.tax_amount) > 0,
            Number(s.discount_amount),
            address,
            s.tax_json_object,
          ),
          isTaxApplicable: Number(s.tax_amount) > 0,
          createdAt: s.created_at,
          createdBy: s.created_by == 0 ? adminUserId : s.created_by,
          updatedAt: s.updated_at,
          modifiedBy: s.modified_by == 0 ? adminUserId : s.modified_by,
          createdIp: s.customer_ip ? s.customer_ip : ':0',
          modifiedIp: s.customer_ip ? s.customer_ip : ':0',
        };
        insertList.push(payObj);
      }

      await this.sequelize.query(`truncate table txn_member_payments restart identity CASCADE`);

      let tempList = [];
      for (let i = 0; i < insertList.length; i++) {
        tempList.push(insertList[i]);
        if (tempList.length === 100) {
          await this.memberPaymentRepository.bulkCreate(tempList);
          tempList = [];
        }
      }
      await this.memberPaymentRepository.bulkCreate(tempList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_member_payments_member_payment_id_seq',
                       (SELECT MAX(member_payment_id) + 1 FROM txn_member_payments));`,
      );
      await this.sequelize.query(
        `SELECT SETVAL('txn_addresses_address_id_seq', (SELECT MAX(address_id) + 1 FROM txn_addresses));`,
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  private async createMemberHealthParameter() {
    try {
      const adminUserId = 1;
      const memberV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/mst_member.json`), 'utf8'));

      await this.sequelize.query(`truncate table txn_member_health_parameters restart identity CASCADE`);
      await this.sequelize.query(`truncate table txn_member_health_parameter_logs restart identity CASCADE`);
      /*const logs = [];
      for (const s of memberV1List) {
        if (s.initial_weight > 0 || s.initial_height > 0) {
          const log = await this.memberHealthParamLogRepository.create({
            memberId: Number(s.id),
            logDate: s.created_at,
            createdAt: s.created_at,
            createdBy: s.created_by > 0 ? s.created_by : adminUserId,
            updatedAt: s.updated_at,
            modifiedBy: s.modified_by > 0 ? s.modified_by : adminUserId,
            createdIp: s.created_ip ? s.created_ip : ':0',
            modifiedIp: s.updated_ip ? s.updated_ip : s.created_ip ? s.created_ip : ':0',
          });
          if (s.initial_weight > 0) {
            logs.push({
              memberHealthParameterLogId: log.memberHealthParameterLogId,
              healthParameterId: 1,
              value: Number(s.initial_weight),
              healthParameterUnitId: s.weight_unit === 'kgs' ? 1 : 3,
            });
          }
          if (s.initial_height > 0) {
            logs.push({
              memberHealthParameterLogId: log.memberHealthParameterLogId,
              healthParameterId: 2,
              value: Number(s.initial_height),
              healthParameterUnitId: s.height_unit === 'cm' ? 4 : 2,
            });
          }
        }
      }

      await this.memberHealthParamRepository.bulkCreate(logs);*/

      const memberHealthParamList = [];
      const memberHealthParamLogList = [];
      let logDate;

      const dp = await this.sequelize.query(`SELECT (MAX(member_health_parameter_log_id) + 1) as max_id
                                             FROM txn_member_health_parameter_logs;`);
      let memberHealthLogId = dp[0][0]['max_id'];

      const unitList = await this.getAllHealthParamUnits();
      const healthParamListV1List = JSON.parse(
        readFileSync(resolve(`${this.folderPath}/txn_member_key_parameter.json`), 'utf8'),
      );
      let keyWeekIds;
      let paramList;

      const memberIdList = uniq(healthParamListV1List.map((x) => x.member_id));
      for (const mId of memberIdList) {
        keyWeekIds = healthParamListV1List.filter((x) => x.member_id === mId).map((x) => x.week_id);

        for (const wk of keyWeekIds) {
          paramList = healthParamListV1List.filter((x) => x.member_id === mId && x.week_id === wk);
          const s = paramList[0];
          logDate = moment(s.created_at).format(DB_DATE_FORMAT);

          if (!memberHealthParamLogList.find((x) => x.memberId === s.member_id && x.logDate == logDate)) {
            memberHealthLogId = memberHealthLogId + 1;

            memberHealthParamLogList.push({
              memberHealthParameterLogId: memberHealthLogId,
              memberId: s.member_id,
              logDate: logDate,
              active: s.active,
              createdAt: s.created_at,
              createdBy: s.created_by == 0 ? adminUserId : s.created_by,
              updatedAt: s.updated_at,
              modifiedBy: s.modified_by == 0 ? adminUserId : s.modified_by,
              createdIp: ':0',
              modifiedIp: ':0',
            });

            for (const s of paramList) {
              if (
                !memberHealthParamList.find(
                  (x) =>
                    x.memberId === s.member_id &&
                    x.memberHealthParameterLogId == memberHealthLogId &&
                    x.healthParameterId == s.key_parameter_id,
                )
              ) {
                memberHealthParamList.push({
                  memberId: s.member_id,
                  memberHealthParameterLogId: memberHealthLogId,
                  healthParameterId: s.key_parameter_id,
                  healthParameterUnitId: unitList.find(
                    (x) => x.healthParameterUnit.toLowerCase() === s.unit.toLowerCase(),
                  )?.healthParameterUnitId,
                  value: s.value,
                  createdAt: s.created_at,
                  createdBy: s.created_by == 0 ? adminUserId : s.created_by,
                  updatedAt: s.updated_at,
                  modifiedBy: s.modified_by == 0 ? adminUserId : s.modified_by,
                  createdIp: ':0',
                  modifiedIp: ':0',
                });
              }
            }
          }
        }
      }
      //First save Log as it is used as FK
      await this.memberHealthParamLogRepository.bulkCreate(memberHealthParamLogList);
      await this.memberHealthParamRepository.bulkCreate(memberHealthParamList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_member_health_parameter_l_member_health_parameter_log_i_seq',
                       (SELECT MAX(member_health_parameter_log_id) + 1 FROM txn_member_health_parameter_logs));`,
      );
      await this.sequelize.query(
        `SELECT SETVAL('txn_member_health_parameters_member_health_parameter_id_seq',
                       (SELECT MAX(member_health_parameter_id) + 1 FROM txn_member_health_parameters));`,
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  private async createMemberDietPlan() {
    try {
      await this.sequelize.query(`truncate table txn_member_diet_details restart identity CASCADE`);
      await this.sequelize.query(`truncate table txn_member_diet_plans restart identity CASCADE`);

      const adminUserId = 1;
      const memberDietPlanList = [];
      const dietPlanV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_diet_plan.json`), 'utf8'));

      for (const s of dietPlanV1List) {
        memberDietPlanList.push({
          memberDietPlanId: Number(s.id),
          memberId: Number(s.member_id),
          memberPaymentId: Number(s.member_plan_id),
          noOfCycle: Number(s.total_week),
          noOfDaysInCycle: Number(s.no_of_days) || 7,
          currentCycleNo: Number(s.current_week),
          currentDayNo: null,
          isCompleted: s.end_date ? true : false,
          startDate: s.start_date ? moment(s.start_date) : null,
          endDate: s.end_date ? moment(s.end_date) : null,
          active: s.active,
          createdAt: s.created_at,
          createdBy: s.created_by == 0 ? adminUserId : s.created_by,
          updatedAt: s.updated_at,
          modifiedBy: s.modified_by == 0 ? adminUserId : s.modified_by,
          createdIp: ':0',
          modifiedIp: ':0',
        });
      }
      await this.memberDietPlanRepository.bulkCreate(memberDietPlanList);

      //Member Diet Plan Details
      const memberDietPlanDetailList = [];
      const detailV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_diet_plan_details.json`), 'utf8'));
      const recipeV1List = JSON.parse(readFileSync(resolve(`${this.folderPath}/txn_diet_plan_recipe.json`), 'utf8'));
      const recipeCategoryList = await this.getAllRecipeCategories();
      let dietDetailRecipeList = [];
      let recipeIdList;
      let dietDetailV1FilterList = [];
      let weekList = [];
      let dietWeekV1List = [];
      let startDt;
      let endDt;

      for (const dp of dietPlanV1List) {
        dietDetailV1FilterList = detailV1List.filter((x) => x.diet_plan_id === dp.id && x.active == 1);
        weekList = uniq(dietDetailV1FilterList.map((x) => x.week_id));

        //Diet details table will have one entry per week against diet plan
        for (const wk of weekList) {
          dietDetailRecipeList = [];
          dietWeekV1List = dietDetailV1FilterList.filter((x) => x.week_id === wk);

          for (const category of dietWeekV1List) {
            recipeIdList = recipeV1List
              .filter((x) => x.diet_plan_details_id === category.id)
              .map((x) => Number(x.recipe_id));

            dietDetailRecipeList.push({
              recipeCategoryId: Number(category.recipe_category_id),
              recipeCategory: recipeCategoryList.find((x) => x.recipeCategoryId === Number(category.recipe_category_id))
                ?.recipeCategory,
              recipeIds: recipeIdList,
              dietDetail: category.diet_plan,
            });
          }

          startDt = dietWeekV1List && dietWeekV1List.length > 0 ? dietWeekV1List[0].start_date : null;
          endDt = startDt ? moment(startDt).add(7, 'day').format(DB_DATE_FORMAT) : null;

          //ONE ENTRY PER WEEK
          memberDietPlanDetailList.push({
            memberDietPlanId: dp.id,
            dietPlan: dietDetailRecipeList,
            cycleNo: wk,
            type: DietTypeEnum.CYCLE,
            startDate: startDt,
            endDate: endDt,
            createdAt: dp.created_at,
            createdBy: dp.created_by == 0 ? adminUserId : dp.created_by,
            updatedAt: dp.updated_at,
            modifiedBy: dp.modified_by == 0 ? adminUserId : dp.modified_by,
            createdIp: ':0',
            modifiedIp: ':0',
          });
        }
      }

      await this.memberDietPlanDetailRepository.bulkCreate(memberDietPlanDetailList);

      await this.sequelize.query(
        `SELECT SETVAL('txn_member_diet_details_member_diet_detail_id_seq',
                       (SELECT MAX(member_diet_detail_id) + 1 FROM txn_member_diet_details));`,
      );
      await this.sequelize.query(
        `SELECT SETVAL('txn_member_diet_plans_member_diet_plan_id_seq',
                       (SELECT MAX(member_diet_plan_id) + 1 FROM txn_member_diet_plans));`,
      );
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }
}
