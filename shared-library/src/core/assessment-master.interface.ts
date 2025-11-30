import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

// Base interface for simple master tables (gender, blood_sugar, health_issue, eating_habit, lifestyle, marital_status, religion, sleeping_pattern, type_of_exercise, urine_output)
export interface IBaseAssessmentMaster {
  name: string;
  imagePath?: IMediaUpload[];
}

export interface IManageAssessmentMaster extends IBaseAssessmentMaster {
  id?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IAssessmentMaster extends IBaseAssessmentMaster {
  id: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Gender specific interfaces
export interface IBaseGender {
  gender: string;
  imagePath?: IMediaUpload[];
}

export interface IManageGender {
  gender: string;
  genderId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IGender extends IBaseGender {
  genderId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Blood Sugar specific interfaces
export interface IBaseBloodSugar {
  bloodSugar: string;
  imagePath?: IMediaUpload[];
}

export interface IManageBloodSugar {
  bloodSugar: string;
  bloodSugarId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IBloodSugar extends IBaseBloodSugar {
  bloodSugarId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Health Issue specific interfaces
export interface IBaseHealthIssue {
  healthIssue: string;
  imagePath?: IMediaUpload[];
}

export interface IManageHealthIssue {
  healthIssue: string;
  healthIssueId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IHealthIssue extends IBaseHealthIssue {
  healthIssueId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Eating Habit specific interfaces
export interface IBaseEatingHabit {
  eatingHabit: string;
  imagePath?: IMediaUpload[];
}

export interface IManageEatingHabit {
  eatingHabit: string;
  eatingHabitId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IEatingHabit extends IBaseEatingHabit {
  eatingHabitId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Lifestyle specific interfaces
export interface IBaseLifestyle {
  lifestyle: string;
  imagePath?: IMediaUpload[];
}

export interface IManageLifestyle {
  lifestyle: string;
  lifestyleId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface ILifestyle extends IBaseLifestyle {
  lifestyleId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Marital Status specific interfaces
export interface IBaseMaritalStatus {
  maritalStatus: string;
  imagePath?: IMediaUpload[];
}

export interface IManageMaritalStatus {
  maritalStatus: string;
  maritalStatusId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IMaritalStatus extends IBaseMaritalStatus {
  maritalStatusId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Religion specific interfaces
export interface IBaseReligion {
  religion: string;
  imagePath?: IMediaUpload[];
}

export interface IManageReligion {
  religion: string;
  religionId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IReligion extends IBaseReligion {
  religionId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Sleeping Pattern specific interfaces
export interface IBaseSleepingPattern {
  sleepingPattern: string;
  imagePath?: IMediaUpload[];
}

export interface IManageSleepingPattern {
  sleepingPattern: string;
  sleepingPatternId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface ISleepingPattern extends IBaseSleepingPattern {
  sleepingPatternId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Type of Exercise specific interfaces
export interface IBaseTypeOfExercise {
  typeOfExercise: string;
  imagePath?: IMediaUpload[];
}

export interface IManageTypeOfExercise {
  typeOfExercise: string;
  typeOfExerciseId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface ITypeOfExercise extends IBaseTypeOfExercise {
  typeOfExerciseId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Urine Output specific interfaces
export interface IBaseUrineOutput {
  urineOutput: string;
  imagePath?: IMediaUpload[];
}

export interface IManageUrineOutput {
  urineOutput: string;
  urineOutputId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IUrineOutput extends IBaseUrineOutput {
  urineOutputId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Health Parameter specific interfaces (more complex)
export interface IBaseHealthParameter {
  healthParameter: string;
  hintText: string;
  imagePath?: IMediaUpload[];
  isLength: boolean;
  sequence: number;
  fieldType: string;
  requiredField: boolean;
}

export interface IManageHealthParameter extends IBaseHealthParameter {
  healthParameterId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IHealthParameter extends IBaseHealthParameter {
  healthParameterId: number;
  id?: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

