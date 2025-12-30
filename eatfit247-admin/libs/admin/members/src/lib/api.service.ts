import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import {
  ITableList,
  IMember,
  IResponse,
  IManageMember,
  IDropdownItem,
  IMemberCallLog,
  IManageMemberCallLog,
  IMemberIssue,
  IManageMemberIssue,
  IMemberAssessment,
  IManageMemberAssessment,
  IAssessmentMaster,
  IMemberPocketGuide,
  IMemberHealthIssue,
  IMemberIssueResponse,
  IIssueMasterData,
  IMemberHealthParameterLog,
  IManageMemberHealthParameterLog,
  IHealthParameterMaster,
  ICallLogMasterData,
  IAvailableSlot,
  ICallLogSlot,
  IStatusChangeCallLog,
  IMemberPayment,
  IManageMemberPayment,
  IMemberPaymentMasterData,
  IProgramPlan,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class MembersApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMember>> {
    const res = await this.httpService.get<IResponse<ITableList<IMember>>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IMember>;
  }

  async getById(id: number): Promise<IMember> {
    const res = await this.httpService.get<IResponse<IMember>>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IMember;
  }

  async create(data: IManageMember): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageMember): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/manage/${id}`,
      data
    );
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/franchise/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async getReferrerDropdown(): Promise<IDropdownItem[]> {
    const res =
      await this.httpService.get<IResponse<IDropdownItem[]>>(
        '/referrer/dropdown'
      );
    return res.data as IDropdownItem[];
  }

  async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/nutritionist/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async updateStatus(
    id: number,
    active: boolean,
    deactivationReason?: string
  ): Promise<void> {
    return await this.httpService.patch<void>(
      `${this.endpoint}/update-status/${id}`,
      {
        active,
        deactivationReason
      }
    );
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res =
      await this.httpService.get<IResponse<IDropdownItem[]>>(
        `country/dropdown`
      );
    return res.data as IDropdownItem[];
  }

  async getHealthIssues(
    memberId: number
  ): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberHealthIssue>>
    >(`${this.endpoint}/${memberId}/health-issues`);
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async getHealthIssueList(
    memberId: number
  ): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberHealthIssue>>
    >(`${this.endpoint}/${memberId}/health-issues/list`);
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async manageHealthIssues(
    memberId: number,
    healthIssueIds: number[]
  ): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/health-issues/manage`,
      { healthIssueIds }
    );
  }

  async getHealthParameterLogs(
    memberId: number
  ): Promise<IMemberHealthParameterLog[]> {
    const res = await this.httpService.get<
      IResponse<IMemberHealthParameterLog[]>
    >(`${this.endpoint}/${memberId}/health-parameter-logs`);
    return res.data as IMemberHealthParameterLog[];
  }

  async getHealthParameterMasterData(
    memberId: number
  ): Promise<IHealthParameterMaster> {
    const res = await this.httpService.get<IResponse<IHealthParameterMaster>>(
      `${this.endpoint}/${memberId}/health-parameter-logs/master-data`
    );
    return res.data as IHealthParameterMaster;
  }

  async createHealthParameterLog(
    memberId: number,
    data: IManageMemberHealthParameterLog
  ): Promise<IMemberHealthParameterLog> {
    const res = await this.httpService.post<
      IResponse<IMemberHealthParameterLog>
    >(`${this.endpoint}/${memberId}/health-parameter-logs`, data);
    return res.data as IMemberHealthParameterLog;
  }

  async getHealthParameterLog(
    memberId: number,
    logId: number
  ): Promise<IMemberHealthParameterLog> {
    const res = await this.httpService.get<
      IResponse<IMemberHealthParameterLog>
    >(`${this.endpoint}/${memberId}/health-parameter-logs/${logId}`);
    return res.data as IMemberHealthParameterLog;
  }

  async updateHealthParameterLog(
    memberId: number,
    logId: number,
    data: IManageMemberHealthParameterLog
  ): Promise<IMemberHealthParameterLog> {
    const res = await this.httpService.put<
      IResponse<IMemberHealthParameterLog>
    >(`${this.endpoint}/${memberId}/health-parameter-logs/${logId}`, data);
    return res.data as IMemberHealthParameterLog;
  }

  async deleteHealthParameterLog(
    memberId: number,
    logId: number
  ): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/health-parameter-logs/${logId}`
    );
  }

  // region Member Issues
  async getIssuesMasterData(): Promise<IIssueMasterData> {
    const res = await this.httpService.get<IResponse<IIssueMasterData>>(
      `${this.endpoint}/issues-master`
    );
    return res.data as IIssueMasterData;
  }

  async getIssues(memberId: number): Promise<IMemberIssue[]> {
    const res = await this.httpService.get<IResponse<IMemberIssue[]>>(
      `${this.endpoint}/${memberId}/issues`
    );
    return res.data as IMemberIssue[];
  }

  async createIssue(
    memberId: number,
    data: IManageMemberIssue
  ): Promise<IMemberIssue> {
    const res = await this.httpService.post<IResponse<IMemberIssue>>(
      `${this.endpoint}/${memberId}/issues`,
      data
    );
    return res.data as IMemberIssue;
  }

  async updateIssue(
    memberId: number,
    issueId: number,
    data: IManageMemberIssue
  ): Promise<IMemberIssue> {
    const res = await this.httpService.put<IResponse<IMemberIssue>>(
      `${this.endpoint}/${memberId}/issues/${issueId}`,
      data
    );
    return res.data as IMemberIssue;
  }

  async getAssessment(memberId: number): Promise<IMemberAssessment | null> {
    const res = await this.httpService.get<IResponse<IMemberAssessment | null>>(
      `${this.endpoint}/${memberId}/assessment`
    );
    return res.data as IMemberAssessment | null;
  }

  // region Member Issue Responses
  async getIssueResponses(
    memberId: number,
    issueId: number
  ): Promise<IMemberIssueResponse[]> {
    const res = await this.httpService.get<IResponse<IMemberIssueResponse[]>>(
      `${this.endpoint}/${memberId}/issues/${issueId}/responses`
    );
    return res.data as IMemberIssueResponse[];
  }

  async createIssueResponse(
    memberId: number,
    issueId: number,
    data: { response: string }
  ): Promise<IMemberIssueResponse> {
    const res = await this.httpService.post<IResponse<IMemberIssueResponse>>(
      `${this.endpoint}/${memberId}/issues/${issueId}/responses`,
      data
    );
    return res.data as IMemberIssueResponse;
  }

  async markIssueAsSolved(
    memberId: number,
    issueId: number,
    isSolved: boolean
  ): Promise<IMemberIssue> {
    const res = await this.httpService.post<IResponse<IMemberIssue>>(
      `${this.endpoint}/${memberId}/issues/${issueId}/mark-solved`,
      { isSolved }
    );
    return res.data as IMemberIssue;
  }

  // endregion
  async getAssessmentMaster(): Promise<IAssessmentMaster> {
    const res = await this.httpService.get<IResponse<IAssessmentMaster>>(
      `assessment/master-data`
    );
    return res.data as IAssessmentMaster;
  }

  async updateAssessment(
    memberId: number,
    data: IManageMemberAssessment
  ): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/assessment`,
      data
    );
  }

  // region Member Pocket Guides
  async getPocketGuideDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IResponse<IDropdownItem[]>>(
      '/pocket-guide/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async getPocketGuides(
    memberId: number
  ): Promise<ITableList<IMemberPocketGuide>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberPocketGuide>>
    >(`${this.endpoint}/${memberId}/pocket-guide`);
    return res.data as ITableList<IMemberPocketGuide>;
  }

  async getPocketGuideList(
    memberId: number
  ): Promise<ITableList<IMemberPocketGuide>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberPocketGuide>>
    >(`${this.endpoint}/${memberId}/pocket-guide/list`);
    return res.data as ITableList<IMemberPocketGuide>;
  }

  async managePocketGuides(
    memberId: number,
    pocketGuideIds: number[]
  ): Promise<void> {
    return await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/pocket-guide/manage`,
      { pocketGuideIds }
    );
  }

  // endregion
  // region Member Call Logs
  async getCallLogMasterData(memberId: number): Promise<ICallLogMasterData> {
    const res = await this.httpService.get<IResponse<ICallLogMasterData>>(
      `${this.endpoint}/${memberId}/call-logs/master-data`
    );
    return res.data as ICallLogMasterData;
  }

  async getCallLogs(memberId: number): Promise<IMemberCallLog[]> {
    const res = await this.httpService.get<IResponse<IMemberCallLog[]>>(
      `${this.endpoint}/${memberId}/call-logs`
    );
    return res.data as IMemberCallLog[];
  }

  async getAvailableTimeslots(memberId: number, data: IAvailableSlot): Promise<ICallLogSlot[]> {
    // Note: Using POST since GET with body is not standard HTTP
    const res = await this.httpService.post<IResponse<ICallLogSlot[]>>(
      `${this.endpoint}/${memberId}/call-logs/available-timeslot`,
      data
    );
    return res.data as ICallLogSlot[];
  }

  async createCallLog(memberId: number, data: IManageMemberCallLog): Promise<IMemberCallLog> {
    const res = await this.httpService.post<IResponse<IMemberCallLog>>(
      `${this.endpoint}/${memberId}/call-logs`,
      data
    );
    return res.data as IMemberCallLog;
  }

  async cancelCallLog(memberId: number, memberCallLogId: number, reason: string): Promise<void> {
    return await this.httpService.post<void>(
      `${this.endpoint}/${memberId}/call-logs/cancel`,
      <IStatusChangeCallLog>{ memberCallLogId, reason }
    );
  }

  async completeCallLog(memberId: number, memberCallLogId: number, reason: string): Promise<void> {
    return await this.httpService.post<void>(
      `${this.endpoint}/${memberId}/call-logs/complete`,
      <IStatusChangeCallLog>{ memberCallLogId, reason }
    );
  }

  // region Member Payments
  async getPaymentMasterData(memberId: number): Promise<IMemberPaymentMasterData> {
    const res = await this.httpService.get<IResponse<IMemberPaymentMasterData>>(
      `${this.endpoint}/${memberId}/payment-history/master-data`
    );
    return res.data as IMemberPaymentMasterData;
  }

  async getPayments(memberId: number): Promise<ITableList<IMemberPayment>> {
    const res = await this.httpService.get<IResponse<ITableList<IMemberPayment>>>(
      `${this.endpoint}/${memberId}/payment-history`
    );
    return res.data as ITableList<IMemberPayment>;
  }

  async getPayment(memberId: number, paymentId: number): Promise<IMemberPayment> {
    const res = await this.httpService.get<IResponse<IMemberPayment>>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}`
    );
    return res.data as IMemberPayment;
  }

  async createPayment(memberId: number, data: IManageMemberPayment): Promise<IMemberPayment> {
    const res = await this.httpService.post<IResponse<IMemberPayment>>(
      `${this.endpoint}/${memberId}/payment-history`,
      data
    );
    return res.data as IMemberPayment;
  }

  async updatePayment(
    memberId: number,
    paymentId: number,
    data: IManageMemberPayment
  ): Promise<IMemberPayment> {
    const res = await this.httpService.put<IResponse<IMemberPayment>>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}`,
      data
    );
    return res.data as IMemberPayment;
  }

  async deletePayment(memberId: number, paymentId: number): Promise<void> {
    return await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}`
    );
  }

  async getProgramPlanDetails(memberId: number, programPlanId: number): Promise<IProgramPlan> {
    const res = await this.httpService.get<IResponse<IProgramPlan>>(
      `${this.endpoint}/${memberId}/payment-history/program-plan/${programPlanId}`
    );
    return res.data as IProgramPlan;
  }
  // endregion
}

