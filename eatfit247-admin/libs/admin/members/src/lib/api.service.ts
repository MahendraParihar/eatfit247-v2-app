import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import {
  ITableList,
  IMember,
  IResponse,
  IManageMember,
  IDropdownItem,
  IMemberCallLog,
  IMemberIssue,
  IMemberAssessment,
  IManageMemberAssessment,
  IAssessmentMaster,
  IMemberPocketGuide,
  IMemberHealthIssue,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class MembersApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMember>> {
    const res = await this.httpService.get<IResponse<ITableList<IMember>>>(
      `${this.endpoint}/list`,
      { params },
    );
    return res.data as ITableList<IMember>;
  }

  async getById(id: number): Promise<IMember> {
    const res = await this.httpService.get<IResponse<IMember>>(
      `${this.endpoint}/manage/${id}`,
    );
    return res.data as IMember;
  }

  async create(data: IManageMember): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageMember): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/manage/${id}`,
      data,
    );
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/franchise/dropdown',
    );
    return res.data as IDropdownItem[];
  }

  async getReferrerDropdown(): Promise<IDropdownItem[]> {
    const res =
      await this.httpService.get<IResponse<IDropdownItem[]>>(
        '/referrer/dropdown',
      );
    return res.data as IDropdownItem[];
  }

  async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/nutritionist/dropdown',
    );
    return res.data as IDropdownItem[];
  }

  async updateStatus(
    id: number,
    active: boolean,
    deactivationReason?: string,
  ): Promise<void> {
    return await this.httpService.patch<void>(
      `${this.endpoint}/update-status/${id}`,
      {
        active,
        deactivationReason,
      },
    );
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res =
      await this.httpService.get<IResponse<IDropdownItem[]>>(
        `country/dropdown`,
      );
    return res.data as IDropdownItem[];
  }

  async getHealthIssues(memberId: number): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<IResponse<ITableList<IMemberHealthIssue>>>(
      `${this.endpoint}/${memberId}/health-issues`,
    );
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async getHealthIssueList(memberId: number): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<IResponse<ITableList<IMemberHealthIssue>>>(
      `${this.endpoint}/${memberId}/health-issues/list`,
    );
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async manageHealthIssues(memberId: number, healthIssueIds: number[]): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/health-issues/manage`,
      { healthIssueIds },
    );
  }

  async getCallLogs(memberId: number): Promise<IMemberCallLog[]> {
    const res = await this.httpService.get<IResponse<IMemberCallLog[]>>(
      `${this.endpoint}/${memberId}/call-logs`,
    );
    return res.data as IMemberCallLog[];
  }

  async getHealthParameterLogs(memberId: number): Promise<any[]> {
    const res = await this.httpService.get<IResponse<any[]>>(
      `${this.endpoint}/${memberId}/health-parameter-logs`,
    );
    return res.data as any[];
  }

  async getIssues(memberId: number): Promise<IMemberIssue[]> {
    const res = await this.httpService.get<IResponse<IMemberIssue[]>>(
      `${this.endpoint}/${memberId}/issues`,
    );
    return res.data as IMemberIssue[];
  }

  async getAssessment(memberId: number): Promise<IMemberAssessment | null> {
    const res = await this.httpService.get<IResponse<IMemberAssessment | null>>(
      `${this.endpoint}/${memberId}/assessment`,
    );
    return res.data as IMemberAssessment | null;
  }

  async getAssessmentMaster(): Promise<IAssessmentMaster> {
    const res = await this.httpService.get<IResponse<IAssessmentMaster>>(
      `assessment/master-data`,
    );
    return res.data as IAssessmentMaster;
  }

  async updateAssessment(
    memberId: number,
    data: IManageMemberAssessment,
  ): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/assessment`,
      data,
    );
  }

  // region Member Pocket Guides
  async getPocketGuideDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/pocket-guide/dropdown',
    );
    return res.data as IDropdownItem[];
  }
  async getPocketGuides(
    memberId: number,
  ): Promise<ITableList<IMemberPocketGuide>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberPocketGuide>>
    >(`${this.endpoint}/${memberId}/pocket-guide`);
    return res.data as ITableList<IMemberPocketGuide>;
  }

  async getPocketGuideList(
    memberId: number,
  ): Promise<ITableList<IMemberPocketGuide>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberPocketGuide>>
    >(`${this.endpoint}/${memberId}/pocket-guide/list`);
    return res.data as ITableList<IMemberPocketGuide>;
  }

  async managePocketGuides(
    memberId: number,
    pocketGuideIds: number[],
  ): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/pocket-guide/manage`,
      { pocketGuideIds },
    );
  }

  // endregion
}

