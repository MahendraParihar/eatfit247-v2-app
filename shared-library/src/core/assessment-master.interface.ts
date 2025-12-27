import { IBaseAdminUser } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

// Gender specific interfaces
export interface IBaseGender {
  gender: string;
  imagePath?: IMediaUpload[];
}

export interface IManageGender extends IBaseGender {
  genderId?: number;
  active: boolean;
}

export interface IGender extends IBaseGender {
  genderId: number;
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

export interface IManageBloodSugar extends IBaseBloodSugar {
  bloodSugarId?: number;
  active: boolean;
}

export interface IBloodSugar extends IBaseBloodSugar {
  bloodSugarId: number;
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

export interface IManageHealthIssue extends IBaseHealthIssue {
  healthIssue: string;
  healthIssueId?: number;
  active: boolean;
}

export interface IHealthIssue extends IBaseHealthIssue {
  healthIssueId: number;
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

export interface IManageEatingHabit extends IBaseEatingHabit {
  eatingHabitId?: number;
  active: boolean;
}

export interface IEatingHabit extends IBaseEatingHabit {
  eatingHabitId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseLifestyle {
  lifestyle: string;
  imagePath?: IMediaUpload[];
}

export interface IManageLifestyle extends IBaseLifestyle {
  lifestyleId?: number;
  active: boolean;
}

export interface ILifestyle extends IBaseLifestyle {
  lifestyleId: number;
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

export interface IManageMaritalStatus extends IBaseMaritalStatus {
  maritalStatusId?: number;
  active: boolean;
}

export interface IMaritalStatus extends IBaseMaritalStatus {
  maritalStatusId: number;
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

export interface IManageReligion extends IBaseReligion {
  religionId?: number;
  active: boolean;
}

export interface IReligion extends IBaseReligion {
  religionId: number;
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

export interface IManageSleepingPattern extends IBaseSleepingPattern {
  sleepingPatternId?: number;
  active: boolean;
}

export interface ISleepingPattern extends IBaseSleepingPattern {
  sleepingPatternId: number;
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

export interface IManageTypeOfExercise extends IBaseTypeOfExercise {
  typeOfExerciseId?: number;
  active: boolean;
}

export interface ITypeOfExercise extends IBaseTypeOfExercise {
  typeOfExerciseId: number;
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

export interface IManageUrineOutput extends IBaseUrineOutput {
  urineOutputId?: number;
  active: boolean;
}

export interface IUrineOutput extends IBaseUrineOutput {
  urineOutputId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Health Parameter-specific interfaces (more complex)
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
  active: boolean;
}

export interface IHealthParameter extends IBaseHealthParameter {
  healthParameterId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Health Parameter Unit specific interfaces
export interface IBaseHealthParameterUnit {
  healthParameterUnit: string;
}

export interface IManageHealthParameterUnit extends IBaseHealthParameterUnit {
  healthParameterUnitId?: number;
  active: boolean;
}

export interface IHealthParameterUnit extends IBaseHealthParameterUnit {
  healthParameterUnitId: number;
  id: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

