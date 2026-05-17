import { IAdminInfo, ICommonSEO } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';
import { IManageProgramPlan, IProgramPlan } from './program-plan.interface';

export interface IBaseProgram {
  program: string;
  punchLine: string;
  details: string;
  imagePath?: IMediaUpload[];
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  maxPeopleCanRegister?: number | null;
  programPlanId?: number | null;
  seo: ICommonSEO;
}

export interface IManageProgram extends IBaseProgram {
  programId?: number;
  active: boolean;
  programPlan?: IManageProgramPlan;
}

export interface IProgram extends IBaseProgram, IAdminInfo {
  programId: number;
  active: boolean;
  programPlan?: IProgramPlan | null;
}
