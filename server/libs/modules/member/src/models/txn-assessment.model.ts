import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  MstAdminUser,
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstGender,
  MstMaritalStatus,
  MstReligion,
  MstLifestyle,
  MstEatingHabit,
  MstTypeOfExercise,
  MstSleepingPattern,
  MstBloodSugar,
  MstUrineOutput,
  TxnAddress,
} from '@server/common';
import { TxnMember } from './txn-member.model';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_assessments',
  schema: 'public',
  tableName: 'txn_assessments',
  indexes: [
    {
      unique: true,
      fields: ['member_id'],
      name: 'ix_uq_txn_assessment_member_id',
    },
  ],
})
@Scopes(() => ({
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstGender,
        as: 'gender',
        required: false,
        attributes: ['genderId', 'gender'],
      },
      {
        model: MstMaritalStatus,
        as: 'maritalStatus',
        required: false,
        attributes: ['maritalStatusId', 'maritalStatus'],
      },
      {
        model: MstReligion,
        as: 'religion',
        required: false,
        attributes: ['religionId', 'religion'],
      },
      {
        model: MstLifestyle,
        as: 'lifestyle',
        required: false,
        attributes: ['lifestyleId', 'lifestyle'],
      },
      {
        model: MstEatingHabit,
        as: 'eatingHabit',
        required: false,
        attributes: ['eatingHabitId', 'eatingHabit'],
      },
      {
        model: MstTypeOfExercise,
        as: 'typeOfExercise',
        required: false,
        attributes: ['typeOfExerciseId', 'typeOfExercise'],
      },
      {
        model: MstSleepingPattern,
        as: 'sleepingPattern',
        required: false,
        attributes: ['sleepingPatternId', 'sleepingPattern'],
      },
      {
        model: MstBloodSugar,
        as: 'bloodSugar',
        required: false,
        attributes: ['bloodSugarId', 'bloodSugar'],
      },
      {
        model: MstUrineOutput,
        as: 'urineOutput',
        required: false,
        attributes: ['urineOutputId', 'urineOutput'],
      },
    ],
  },
}))
export class TxnAssessment extends Model<TxnAssessment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'assessment_id',
    autoIncrement: true,
  })
  declare assessmentId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;

  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;

  @BelongsTo(() => TxnAddress, {
    foreignKey: 'addressId',
    targetKey: 'addressId',
    as: 'address',
  })
  declare address: TxnAddress;

  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  declare addressId: number;

  @Column({
    allowNull: true,
    field: 'date_of_birth',
    type: DataType.DATEONLY,
  })
  declare dateOfBirth: Date;

  @Column({
    allowNull: true,
    field: 'age',
    type: DataType.INTEGER,
  })
  declare age: number;

  @BelongsTo(() => MstGender, {
    foreignKey: 'genderId',
    targetKey: 'genderId',
    as: 'gender',
  })
  declare gender: MstGender;

  @Column({
    allowNull: false,
    field: 'gender_id',
    type: DataType.INTEGER,
  })
  declare genderId: number;

  @BelongsTo(() => MstMaritalStatus, {
    foreignKey: 'maritalStatusId',
    targetKey: 'maritalStatusId',
    as: 'maritalStatus',
  })
  declare maritalStatus: MstMaritalStatus;

  @Column({
    allowNull: false,
    field: 'marital_status_id',
    type: DataType.INTEGER,
  })
  declare maritalStatusId: number;

  @BelongsTo(() => MstReligion, {
    foreignKey: 'religionId',
    targetKey: 'religionId',
    as: 'religion',
  })
  declare religion: MstReligion;

  @Column({
    allowNull: false,
    field: 'religion_id',
    type: DataType.INTEGER,
  })
  declare religionId: number;

  @BelongsTo(() => MstLifestyle, {
    foreignKey: 'lifestyleId',
    targetKey: 'lifestyleId',
    as: 'lifestyle',
  })
  declare lifestyle: MstLifestyle;

  @Column({
    allowNull: false,
    field: 'lifestyle_id',
    type: DataType.INTEGER,
  })
  declare lifestyleId: number;

  @BelongsTo(() => MstEatingHabit, {
    foreignKey: 'eatingHabitId',
    targetKey: 'eatingHabitId',
    as: 'eatingHabit',
  })
  declare eatingHabit: MstEatingHabit;

  @Column({
    allowNull: false,
    field: 'eating_habit_id',
    type: DataType.INTEGER,
  })
  declare eatingHabitId: number;

  @Column({
    allowNull: true,
    field: 'tobacco_amount',
    type: DataType.STRING(100),
  })
  declare tobaccoAmount: string;

  @Column({
    allowNull: true,
    field: 'tobacco_frequency',
    type: DataType.STRING(100),
  })
  declare tobaccoFrequency: string;

  @Column({
    allowNull: true,
    field: 'paan',
    type: DataType.STRING(100),
  })
  declare paan: string;

  @Column({
    allowNull: true,
    field: 'smoking_amount',
    type: DataType.STRING(100),
  })
  declare smokingAmount: string;

  @Column({
    allowNull: true,
    field: 'smoking_frequency',
    type: DataType.STRING(100),
  })
  declare smokingFrequency: string;

  @Column({
    allowNull: true,
    field: 'alcohol_drink',
    type: DataType.STRING(100),
  })
  declare alcoholDrink: string;

  @Column({
    allowNull: true,
    field: 'alcohol_frequency',
    type: DataType.STRING(100),
  })
  declare alcoholFrequency: string;

  @Column({
    allowNull: true,
    field: 'alcohol_amount',
    type: DataType.STRING(100),
  })
  declare alcoholAmount: string;

  @Column({
    allowNull: true,
    field: 'aerated_drinks',
    type: DataType.STRING(100),
  })
  declare aeratedDrinks: string;

  @Column({
    allowNull: true,
    field: 'water_intake',
    type: DataType.STRING(100),
  })
  declare waterIntake: string;

  @Column({
    allowNull: true,
    field: 'religious',
    type: DataType.STRING(100),
  })
  declare religious: string;

  @Column({
    allowNull: true,
    field: 'fasting',
    type: DataType.STRING(100),
  })
  declare fasting: string;

  @Column({
    allowNull: true,
    field: 'restaurant_visit',
    type: DataType.STRING(100),
  })
  declare restaurantVisit: string;

  @Column({
    allowNull: true,
    field: 'preferred_cuisine',
    type: DataType.STRING(100),
  })
  declare preferredCuisine: string;

  @Column({
    allowNull: true,
    field: 'who_cooks',
    type: DataType.STRING(100),
  })
  declare whoCooks: string;

  @Column({
    allowNull: true,
    field: 'hunger_peak',
    type: DataType.STRING(100),
  })
  declare hungerPeak: string;

  @Column({
    allowNull: true,
    field: 'food_dislikes',
    type: DataType.STRING(100),
  })
  declare foodDislikes: string;

  @Column({
    allowNull: true,
    field: 'other_food_preferences',
    type: DataType.STRING(100),
  })
  declare otherFoodPreferences: string;

  @Column({
    allowNull: false,
    field: 'do_you_exercise',
    type: DataType.STRING(100),
  })
  declare doYouExercise: string;

  @BelongsTo(() => MstTypeOfExercise, {
    foreignKey: 'typeOfExerciseId',
    targetKey: 'typeOfExerciseId',
    as: 'typeOfExercise',
  })
  declare typeOfExercise: MstTypeOfExercise;

  @Column({
    allowNull: true,
    field: 'type_of_exercise_id',
    type: DataType.INTEGER,
  })
  declare typeOfExerciseId: number;

  @Column({
    allowNull: true,
    field: 'frequency',
    type: DataType.STRING(100),
  })
  declare frequency: string;

  @Column({
    allowNull: true,
    field: 'duration',
    type: DataType.STRING(100),
  })
  declare duration: string;

  @Column({
    allowNull: true,
    field: 'time',
    type: DataType.STRING(100),
  })
  declare time: string;

  @Column({
    allowNull: true,
    field: 'allergies',
    type: DataType.STRING(100),
  })
  declare allergies: string;

  @Column({
    allowNull: true,
    field: 'allergy_specify',
    type: DataType.STRING(100),
  })
  declare allergySpecify: string;

  @BelongsTo(() => MstSleepingPattern, {
    foreignKey: 'sleepingPatternId',
    targetKey: 'sleepingPatternId',
    as: 'sleepingPattern',
  })
  declare sleepingPattern: MstSleepingPattern;

  @Column({
    allowNull: true,
    field: 'sleeping_pattern_id',
    type: DataType.INTEGER,
  })
  declare sleepingPatternId: number;

  @Column({
    allowNull: true,
    field: 'sleep_duration',
    type: DataType.STRING(100),
  })
  declare sleepDuration: string;

  @Column({
    allowNull: true,
    field: 'gas',
    type: DataType.STRING(100),
  })
  declare gas: string;

  @Column({
    allowNull: true,
    field: 'hyper_acidity',
    type: DataType.STRING(100),
  })
  declare hyperAcidity: string;

  @Column({
    allowNull: true,
    field: 'constipation',
    type: DataType.STRING(100),
  })
  declare constipation: string;

  @Column({
    allowNull: true,
    field: 'periods',
    type: DataType.STRING(100),
  })
  declare periods: string;

  @Column({
    allowNull: true,
    field: 'lmp',
    type: DataType.STRING(100),
  })
  declare lmp: string;

  @Column({
    allowNull: true,
    field: 'days_cycle',
    type: DataType.STRING(100),
  })
  declare daysCycle: string;

  @Column({
    allowNull: true,
    field: 'hair_fall',
    type: DataType.STRING(100),
  })
  declare hairFall: string;

  @Column({
    allowNull: true,
    field: 'knee_pain',
    type: DataType.STRING(100),
  })
  declare kneePain: string;

  @Column({
    allowNull: true,
    field: 'back_pain',
    type: DataType.STRING(100),
  })
  declare backPain: string;

  @BelongsTo(() => MstBloodSugar, {
    foreignKey: 'bloodSugarId',
    targetKey: 'bloodSugarId',
    as: 'bloodSugar',
  })
  declare bloodSugar: MstBloodSugar;

  @Column({
    allowNull: true,
    field: 'blood_sugar_id',
    type: DataType.INTEGER,
  })
  declare bloodSugarId: number;

  @Column({
    allowNull: true,
    field: 'blood_sugar_value',
    type: DataType.STRING(250),
  })
  declare bloodSugarValue: string;

  @Column({
    allowNull: true,
    field: 'cholesterol',
    type: DataType.STRING(100),
  })
  declare cholesterol: string;

  @Column({
    allowNull: true,
    field: 'triglycerides',
    type: DataType.STRING(100),
  })
  declare triglycerides: string;

  @Column({
    allowNull: true,
    field: 'hdl_cholesterol',
    type: DataType.STRING(100),
  })
  declare hdlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'ldl_cholesterol',
    type: DataType.STRING(100),
  })
  declare ldlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'vldl_cholesterol',
    type: DataType.STRING(100),
  })
  declare vldlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'hg_level',
    type: DataType.STRING(100),
  })
  declare hgLevel: string;

  @BelongsTo(() => MstUrineOutput, {
    foreignKey: 'urineOutputId',
    targetKey: 'urineOutputId',
    as: 'urineOutput',
  })
  declare urineOutput: MstUrineOutput;

  @Column({
    allowNull: true,
    field: 'urine_output_id',
    type: DataType.INTEGER,
  })
  declare urineOutputId: number;

  @Column({
    allowNull: true,
    field: 'supplement_medicine',
    type: DataType.STRING(100),
  })
  declare supplementMedicine: string;

  @Column({
    allowNull: true,
    field: 'wakeup_timing',
    type: DataType.STRING(100),
  })
  declare wakeupTiming: string;

  @Column({
    allowNull: true,
    field: 'bf_menu',
    type: DataType.STRING(250),
  })
  declare bfMenu: string;

  @Column({
    allowNull: true,
    field: 'bf_time',
    type: DataType.STRING(250),
  })
  declare bfTime: string;

  @Column({
    allowNull: true,
    field: 'mm_menu',
    type: DataType.STRING(250),
  })
  declare mmMenu: string;

  @Column({
    allowNull: true,
    field: 'mm_time',
    type: DataType.STRING(250),
  })
  declare mmTime: string;

  @Column({
    allowNull: true,
    field: 'lunch_menu',
    type: DataType.STRING(250),
  })
  declare lunchMenu: string;

  @Column({
    allowNull: true,
    field: 'lunch_time',
    type: DataType.STRING(250),
  })
  declare lunchTime: string;

  @Column({
    allowNull: true,
    field: 'eve_menu',
    type: DataType.STRING(250),
  })
  declare eveMenu: string;

  @Column({
    allowNull: true,
    field: 'eve_time',
    type: DataType.STRING(250),
  })
  declare eveTime: string;

  @Column({
    allowNull: true,
    field: 'mid_eve_menu',
    type: DataType.STRING(250),
  })
  declare midEveMenu: string;

  @Column({
    allowNull: true,
    field: 'mid_eve_time',
    type: DataType.STRING(250),
  })
  declare midEveTime: string;

  @Column({
    allowNull: true,
    field: 'dinner_menu',
    type: DataType.STRING(250),
  })
  declare dinnerMenu: string;

  @Column({
    allowNull: true,
    field: 'dinner_time',
    type: DataType.STRING(250),
  })
  declare dinnerTime: string;

  @Column({
    allowNull: true,
    field: 'night_snacks',
    type: DataType.STRING(250),
  })
  declare nightSnacks: string;

  @Column({
    allowNull: true,
    field: 'bed_time',
    type: DataType.STRING(250),
  })
  declare bedTime: string;

  @Column({
    allowNull: true,
    field: 'fruits_frequency',
    type: DataType.STRING(250),
  })
  declare fruitsFrequency: string;

  @Column({
    allowNull: true,
    field: 'break_frequency',
    type: DataType.STRING(250),
  })
  declare breakFrequency: string;

  @Column({
    allowNull: true,
    field: 'bread_amount',
    type: DataType.STRING(250),
  })
  declare breadAmount: string;

  @Column({
    allowNull: true,
    field: 'sweet_frequency',
    type: DataType.STRING(250),
  })
  declare sweetFrequency: string;

  @Column({
    allowNull: true,
    field: 'sweet_amount',
    type: DataType.STRING(250),
  })
  declare sweetAmount: string;

  @Column({
    allowNull: true,
    field: 'tea_frequency',
    type: DataType.STRING(250),
  })
  declare teaFrequency: string;

  @Column({
    allowNull: true,
    field: 'tea_amount',
    type: DataType.STRING(250),
  })
  declare teaAmount: string;

  @Column({
    allowNull: true,
    field: 'nutritionist_summery',
    type: DataType.STRING(InputLengthEnum.CHAR_2000),
  })
  declare nutritionistSummery: string;

  @Column({
    allowNull: true,
    field: 'remark',
    type: DataType.STRING(InputLengthEnum.CHAR_2000),
  })
  declare remark: string;

  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}
