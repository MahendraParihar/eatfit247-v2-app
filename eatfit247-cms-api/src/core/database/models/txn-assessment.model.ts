import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { MstGender } from './mst-gender.model';
import { MstMaritalStatus } from './mst-marital-status.model';
import { MstReligion } from './mst-religion.model';
import { MstLifestyle } from './mst-lifestyle.model';
import { MstEatingHabit } from './mst-eating-habit.model';
import { MstTypeOfExercise } from './mst-type-of-exercise.model';
import { MstSleepingPattern } from './mst-sleeping-pattern.model';
import { MstBloodSugar } from './mst-blood-sugar.model';
import { MstUrineOutput } from './mst-urine-output.model';

@Table({
  modelName: 'txn_assessment',
  schema: 'public',
  indexes: [
    {
      unique: true,
      fields: ['member_id'],
      name: 'ix_uq_txn_assessment_member_id',
    },
  ],
})
export class TxnAssessment extends Model<TxnAssessment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'assessment_id',
    autoIncrement: true,
  })
  assessmentId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberAssessment',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @Column({
    allowNull: true,
    field: 'date_of_birth',
    type: DataType.DATEONLY,
  })
  dateOfBirth: Date;

  @Column({
    allowNull: true,
    field: 'age',
    type: DataType.INTEGER,
  })
  age: number;

  @BelongsTo(() => MstGender, {
    foreignKey: 'genderId',
    targetKey: 'genderId',
    as: 'MemberAssessmentGender',
  })
  @Column({
    allowNull: false,
    field: 'gender_id',
    type: DataType.INTEGER,
  })
  genderId: number;

  @BelongsTo(() => MstMaritalStatus, {
    foreignKey: 'maritalStatusId',
    targetKey: 'maritalStatusId',
    as: 'MemberAssessmentMaritalStatus',
  })
  @Column({
    allowNull: false,
    field: 'marital_status_id',
    type: DataType.INTEGER,
  })
  maritalStatusId: number;

  @BelongsTo(() => MstReligion, {
    foreignKey: 'religionId',
    targetKey: 'religionId',
    as: 'MemberAssessmentReligion',
  })
  @Column({
    allowNull: false,
    field: 'religion_id',
    type: DataType.INTEGER,
  })
  religionId: number;

  @BelongsTo(() => MstLifestyle, {
    foreignKey: 'lifestyleId',
    targetKey: 'lifestyleId',
    as: 'MemberAssessmentLifestyle',
  })
  @Column({
    allowNull: false,
    field: 'lifestyle_id',
    type: DataType.INTEGER,
  })
  lifestyleId: number;

  @BelongsTo(() => MstEatingHabit, {
    foreignKey: 'eatingHabitId',
    targetKey: 'eatingHabitId',
    as: 'MemberAssessmentEatingHabit',
  })
  @Column({
    allowNull: false,
    field: 'eating_habit_id',
    type: DataType.INTEGER,
  })
  eatingHabitId: number;

  @Column({
    allowNull: true,
    field: 'tobacco_amount',
    type: DataType.STRING(100),
  })
  tobaccoAmount: string;

  @Column({
    allowNull: true,
    field: 'tobacco_frequency',
    type: DataType.STRING(100),
  })
  tobaccoFrequency: string;

  @Column({
    allowNull: true,
    field: 'paan',
    type: DataType.STRING(100),
  })
  paan: string;

  @Column({
    allowNull: true,
    field: 'smoking_amount',
    type: DataType.STRING(100),
  })
  smokingAmount: string;

  @Column({
    allowNull: true,
    field: 'smoking_frequency',
    type: DataType.STRING(100),
  })
  smokingFrequency: string;

  @Column({
    allowNull: true,
    field: 'alcohol_drink',
    type: DataType.STRING(100),
  })
  alcoholDrink: string;

  @Column({
    allowNull: true,
    field: 'alcohol_frequency',
    type: DataType.STRING(100),
  })
  alcoholFrequency: string;

  @Column({
    allowNull: true,
    field: 'alcohol_amount',
    type: DataType.STRING(100),
  })
  alcoholAmount: string;

  @Column({
    allowNull: true,
    field: 'aerated_drinks',
    type: DataType.STRING(100),
  })
  aeratedDrinks: string;

  @Column({
    allowNull: true,
    field: 'water_intake',
    type: DataType.STRING(100),
  })
  waterIntake: string;

  @Column({
    allowNull: true,
    field: 'religious',
    type: DataType.STRING(100),
  })
  religious: string;

  @Column({
    allowNull: true,
    field: 'fasting',
    type: DataType.STRING(100),
  })
  fasting: string;

  @Column({
    allowNull: true,
    field: 'restaurant_visit',
    type: DataType.STRING(100),
  })
  restaurantVisit: string;

  @Column({
    allowNull: true,
    field: 'preferred_cuisine',
    type: DataType.STRING(100),
  })
  preferredCuisine: string;

  @Column({
    allowNull: true,
    field: 'who_cooks',
    type: DataType.STRING(100),
  })
  whoCooks: string;

  @Column({
    allowNull: true,
    field: 'hunger_peak',
    type: DataType.STRING(100),
  })
  hungerPeak: string;

  @Column({
    allowNull: true,
    field: 'food_dislikes',
    type: DataType.STRING(100),
  })
  foodDislikes: string;

  @Column({
    allowNull: true,
    field: 'other_food_preferences',
    type: DataType.STRING(100),
  })
  otherFoodPreferences: string;

  @Column({
    allowNull: false,
    field: 'do_you_exercise',
    type: DataType.STRING(100),
  })
  doYouExercise: string;

  @BelongsTo(() => MstTypeOfExercise, {
    foreignKey: 'typeOfExerciseId',
    targetKey: 'typeOfExerciseId',
    as: 'MemberAssessmentTypeOfExercise',
  })
  @Column({
    allowNull: true,
    field: 'type_of_exercise_id',
    type: DataType.INTEGER,
  })
  typeOfExerciseId: number;

  @Column({
    allowNull: true,
    field: 'frequency',
    type: DataType.STRING(100),
  })
  frequency: string;

  @Column({
    allowNull: true,
    field: 'duration',
    type: DataType.STRING(100),
  })
  duration: string;

  @Column({
    allowNull: true,
    field: 'time',
    type: DataType.STRING(100),
  })
  time: string;

  @Column({
    allowNull: true,
    field: 'allergies',
    type: DataType.STRING(100),
  })
  allergies: string;

  @Column({
    allowNull: true,
    field: 'allergy_specify',
    type: DataType.STRING(100),
  })
  allergySpecify: string;

  @BelongsTo(() => MstSleepingPattern, {
    foreignKey: 'sleepingPatternId',
    targetKey: 'sleepingPatternId',
    as: 'MemberAssessmentSleepingPattern',
  })
  @Column({
    allowNull: true,
    field: 'sleeping_pattern_id',
    type: DataType.INTEGER,
  })
  sleepingPatternId: number;

  @Column({
    allowNull: true,
    field: 'sleep_duration',
    type: DataType.STRING(100),
  })
  sleepDuration: string;

  @Column({
    allowNull: true,
    field: 'gas',
    type: DataType.STRING(100),
  })
  gas: string;

  @Column({
    allowNull: true,
    field: 'hyper_acidity',
    type: DataType.STRING(100),
  })
  hyperAcidity: string;

  @Column({
    allowNull: true,
    field: 'constipation',
    type: DataType.STRING(100),
  })
  constipation: string;

  @Column({
    allowNull: true,
    field: 'periods',
    type: DataType.STRING(100),
  })
  periods: string;

  @Column({
    allowNull: true,
    field: 'lmp',
    type: DataType.STRING(100),
  })
  lmp: string;

  @Column({
    allowNull: true,
    field: 'days_cycle',
    type: DataType.STRING(100),
  })
  daysCycle: string;

  @Column({
    allowNull: true,
    field: 'hair_fall',
    type: DataType.STRING(100),
  })
  hairFall: string;

  @Column({
    allowNull: true,
    field: 'knee_pain',
    type: DataType.STRING(100),
  })
  kneePain: string;

  @Column({
    allowNull: true,
    field: 'back_pain',
    type: DataType.STRING(100),
  })
  backPain: string;

  @BelongsTo(() => MstBloodSugar, {
    foreignKey: 'bloodSugarId',
    targetKey: 'bloodSugarId',
    as: 'MemberAssessmentBloodSugar',
  })
  @Column({
    allowNull: true,
    field: 'blood_sugar_id',
    type: DataType.INTEGER,
  })
  bloodSugarId: number;

  @Column({
    allowNull: true,
    field: 'blood_sugar_value',
    type: DataType.STRING(100),
  })
  bloodSugarValue: string;

  @Column({
    allowNull: true,
    field: 'cholesterol',
    type: DataType.STRING(100),
  })
  cholesterol: string;

  @Column({
    allowNull: true,
    field: 'triglycerides',
    type: DataType.STRING(100),
  })
  triglycerides: string;

  @Column({
    allowNull: true,
    field: 'hdl_cholesterol',
    type: DataType.STRING(100),
  })
  hdlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'ldl_cholesterol',
    type: DataType.STRING(100),
  })
  ldlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'vldl_cholesterol',
    type: DataType.STRING(100),
  })
  vldlCholesterol: string;

  @Column({
    allowNull: true,
    field: 'hg_level',
    type: DataType.STRING(100),
  })
  hgLevel: string;

  @BelongsTo(() => MstUrineOutput, {
    foreignKey: 'urineOutputId',
    targetKey: 'urineOutputId',
    as: 'MemberAssessmentUrineOutput',
  })
  @Column({
    allowNull: true,
    field: 'urine_output_id',
    type: DataType.INTEGER,
  })
  urineOutputId: number;

  @Column({
    allowNull: true,
    field: 'supplement_medicine',
    type: DataType.STRING(100),
  })
  supplementMedicine: string;

  @Column({
    allowNull: true,
    field: 'wakeup_timing',
    type: DataType.STRING(100),
  })
  wakeupTiming: string;

  @Column({
    allowNull: true,
    field: 'bf_menu',
    type: DataType.STRING(250),
  })
  bfMenu: string;

  @Column({
    allowNull: true,
    field: 'bf_time',
    type: DataType.STRING(250),
  })
  bfTime: string;

  @Column({
    allowNull: true,
    field: 'mm_menu',
    type: DataType.STRING(250),
  })
  mmMenu: string;

  @Column({
    allowNull: true,
    field: 'mm_time',
    type: DataType.STRING(250),
  })
  mmTime: string;

  @Column({
    allowNull: true,
    field: 'lunch_menu',
    type: DataType.STRING(250),
  })
  lunchMenu: string;

  @Column({
    allowNull: true,
    field: 'lunch_time',
    type: DataType.STRING(250),
  })
  lunchTime: string;

  @Column({
    allowNull: true,
    field: 'eve_menu',
    type: DataType.STRING(250),
  })
  eveMenu: string;

  @Column({
    allowNull: true,
    field: 'eve_time',
    type: DataType.STRING(250),
  })
  eveTime: string;

  @Column({
    allowNull: true,
    field: 'mid_eve_menu',
    type: DataType.STRING(250),
  })
  midEveMenu: string;

  @Column({
    allowNull: true,
    field: 'mid_eve_time',
    type: DataType.STRING(250),
  })
  midEveTime: string;

  @Column({
    allowNull: true,
    field: 'dinner_menu',
    type: DataType.STRING(250),
  })
  dinnerMenu: string;

  @Column({
    allowNull: true,
    field: 'dinner_time',
    type: DataType.STRING(250),
  })
  dinnerTime: string;

  @Column({
    allowNull: true,
    field: 'night_snacks',
    type: DataType.STRING(250),
  })
  nightSnacks: string;

  @Column({
    allowNull: true,
    field: 'bed_time',
    type: DataType.STRING(250),
  })
  bedTime: string;

  @Column({
    allowNull: true,
    field: 'fruits_frequency',
    type: DataType.STRING(250),
  })
  fruitsFrequency: string;

  @Column({
    allowNull: true,
    field: 'break_frequency',
    type: DataType.STRING(250),
  })
  breakFrequency: string;

  @Column({
    allowNull: true,
    field: 'bread_amount',
    type: DataType.STRING(250),
  })
  breadAmount: string;

  @Column({
    allowNull: true,
    field: 'sweet_frequency',
    type: DataType.STRING(250),
  })
  sweetFrequency: string;

  @Column({
    allowNull: true,
    field: 'sweet_amount',
    type: DataType.STRING(250),
  })
  sweetAmount: string;

  @Column({
    allowNull: true,
    field: 'tea_frequency',
    type: DataType.STRING(250),
  })
  teaFrequency: string;

  @Column({
    allowNull: true,
    field: 'tea_amount',
    type: DataType.STRING(250),
  })
  teaAmount: string;

  @Column({
    allowNull: true,
    field: 'nutritionist_summery',
    type: DataType.STRING(2000),
  })
  nutritionistSummery: string;

  @Column({
    allowNull: true,
    field: 'remark',
    type: DataType.STRING(2000),
  })
  remark: string;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: false,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
