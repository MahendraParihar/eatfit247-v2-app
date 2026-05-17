import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import {
  IAddress,
  IAddressMaster,
  IAssessmentMaster,
  IAvailableSlot,
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  ICalculateTaxResponse,
  ICallLogMasterData,
  ICallLogSlot,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IHealthParameterMaster,
  IIssueMasterData,
  IManageAddress,
  IManageMember,
  IManageMemberAssessment,
  IManageMemberCallLog,
  IManageMemberHealthParameterLog,
  IManageMemberIssue,
  IManageMemberPayment,
  IManageMemberProduct,
  IMember,
  IMemberAssessment,
  IMemberCallLog,
  IMemberDashboardSummary,
  IMemberDietDetail,
  IMemberDietPlan,
  IMemberDietPlanDetail,
  IMemberEngagement,
  IMemberHealthIssue,
  IMemberHealthParameterLog,
  IMemberHealthProgress,
  IMemberIssue,
  IMemberIssueResponse,
  IMemberIssuesSummary,
  IMemberPayment,
  IMemberPaymentMasterData,
  IMemberPaymentsSummary,
  IMemberPocketGuide,
  IMemberProduct,
  IMemberProductMasterData,
  IPaymentLinkResponse,
  IPlanTaxCalculationRequest,
  IProgramPlan,
  IResponse,
  IStatusChangeCallLog,
  ITableList,
  ITableListFilter
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class MembersApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/member';

  async getList(
    params?: ITableListFilter & { sortBy?: string; sortOrder?: string; franchiseId?: number; countryId?: number }
  ): Promise<ITableList<IMember>> {
    const res = await this.httpService.get<ITableList<IMember>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IMember>;
  }

  async getById(id: number): Promise<IMember> {
    const res = await this.httpService.get<IMember>(
      `${this.endpoint}/manage/${id}`
    );
    return res.data as IMember;
  }

  async create(data: IManageMember): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IManageMember): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      '/franchise/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async getReferrerDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      '/referrer/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(
      '/admin-user/nutritionist/dropdown'
    );
    return res.data as IDropdownItem[];
  }

  async updateStatus(
    id: number,
    active: boolean,
    deactivationReason?: string
  ): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, {
      active,
      deactivationReason,
    });
  }

  async updateNutritionist(
    id: number,
    nutritionistId: number | null
  ): Promise<void> {
    await this.httpService.patch<void>(
      `${this.endpoint}/update-nutritionist/${id}`,
      {
        nutritionistId,
      }
    );
  }

  async updateFranchise(id: number, franchiseId: number | null): Promise<void> {
    await this.httpService.patch<void>(
      `${this.endpoint}/update-franchise/${id}`,
      {
        franchiseId,
      }
    );
  }

  async getCountryDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>(`country/dropdown`);
    return res.data as IDropdownItem[];
  }

  async getHealthIssues(
    memberId: number
  ): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<ITableList<IMemberHealthIssue>>(
      `${this.endpoint}/${memberId}/health-issues`
    );
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async getHealthIssueList(
    memberId: number
  ): Promise<ITableList<IMemberHealthIssue>> {
    const res = await this.httpService.get<ITableList<IMemberHealthIssue>>(
      `${this.endpoint}/${memberId}/health-issues/list`
    );
    return res.data as ITableList<IMemberHealthIssue>;
  }

  async manageHealthIssues(
    memberId: number,
    healthIssueIds: number[]
  ): Promise<void> {
    await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/health-issues/manage`,
      { healthIssueIds }
    );
  }

  async getHealthParameterLogs(
    memberId: number
  ): Promise<IMemberHealthParameterLog[]> {
    const res = await this.httpService.get<IMemberHealthParameterLog[]>(
      `${this.endpoint}/${memberId}/health-parameter-logs`
    );
    return res.data as IMemberHealthParameterLog[];
  }

  async getHealthParameterMasterData(
    memberId: number
  ): Promise<IHealthParameterMaster> {
    const res = await this.httpService.get<IHealthParameterMaster>(
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
    const res = await this.httpService.get<IMemberHealthParameterLog>(
      `${this.endpoint}/${memberId}/health-parameter-logs/${logId}`
    );
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
    await this.httpService.put<void>(
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
    await this.httpService.put<void>(
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

  async getAvailableTimeslots(
    memberId: number,
    data: IAvailableSlot
  ): Promise<ICallLogSlot[]> {
    // Note: Using POST since GET with body is not standard HTTP
    const res = await this.httpService.post<IResponse<ICallLogSlot[]>>(
      `${this.endpoint}/${memberId}/call-logs/available-timeslot`,
      data
    );
    return res.data as ICallLogSlot[];
  }

  async createCallLog(
    memberId: number,
    data: IManageMemberCallLog
  ): Promise<IMemberCallLog> {
    const res = await this.httpService.post<IResponse<IMemberCallLog>>(
      `${this.endpoint}/${memberId}/call-logs`,
      data
    );
    return res.data as IMemberCallLog;
  }

  async cancelCallLog(
    memberId: number,
    memberCallLogId: number,
    reason: string
  ): Promise<void> {
    await this.httpService.post<void>(
      `${this.endpoint}/${memberId}/call-logs/cancel`,
      <IStatusChangeCallLog>{ memberCallLogId, reason }
    );
  }

  async completeCallLog(
    memberId: number,
    memberCallLogId: number,
    reason: string
  ): Promise<void> {
    await this.httpService.post<void>(
      `${this.endpoint}/${memberId}/call-logs/complete`,
      <IStatusChangeCallLog>{ memberCallLogId, reason }
    );
  }

  // region Member Payments
  async getPaymentMasterData(
    memberId: number
  ): Promise<IMemberPaymentMasterData> {
    const res = await this.httpService.get<IResponse<IMemberPaymentMasterData>>(
      `${this.endpoint}/${memberId}/payment-history/master-data`
    );
    return res.data as IMemberPaymentMasterData;
  }

  async getPayments(memberId: number): Promise<ITableList<IMemberPayment>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberPayment>>
    >(`${this.endpoint}/${memberId}/payment-history`);
    return res.data as ITableList<IMemberPayment>;
  }

  async getPayment(
    memberId: number,
    paymentId: number
  ): Promise<IMemberPayment> {
    const res = await this.httpService.get<IResponse<IMemberPayment>>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}`
    );
    return res.data as IMemberPayment;
  }

  async createPayment(
    memberId: number,
    data: IManageMemberPayment
  ): Promise<IMemberPayment> {
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
    await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}`
    );
  }

  async downloadInvoice(
    memberId: number,
    paymentId: number
  ): Promise<{
    buffer: string;
    fileName: string;
  }> {
    const res = await this.httpService.get<
      IResponse<{
        buffer: string;
        fileName: string;
      }>
    >(`${this.endpoint}/${memberId}/payment-history/${paymentId}/invoice`);
    return res.data as { buffer: string; fileName: string };
  }

  async getProgramPlanDetails(
    memberId: number,
    programPlanId: number
  ): Promise<IProgramPlan> {
    const res = await this.httpService.get<IResponse<IProgramPlan>>(
      `${this.endpoint}/${memberId}/payment-history/program-plan/${programPlanId}`
    );
    return res.data as IProgramPlan;
  }

  async calculateTax(
    memberId: number,
    data: IPlanTaxCalculationRequest
  ): Promise<ICalculateTaxResponse> {
    const res = await this.httpService.post<IResponse<ICalculateTaxResponse>>(
      `${this.endpoint}/${memberId}/payment-history/calculate-tax`,
      data
    );
    return res.data as ICalculateTaxResponse;
  }

  async getSupportedPaymentGateways(
    memberId: number,
    currency: string
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
    const res = await this.httpService.get<
      IResponse<
        Array<{
          franchisePaymentGatewayId: number;
          gatewayCode: string;
          gatewayName: string;
          providerCountryCode: string;
          currencyCode: string;
          isPrimary: boolean;
          supportsDomestic: boolean;
          supportsInternational: boolean;
        }>
      >
    >(`${this.endpoint}/${memberId}/payment-history/supported-gateways`, {
      params: { currency },
    });
    return res.data as Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>;
  }

  async getProductSupportedPaymentGateways(
    memberId: number,
    currency: string
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
    const res = await this.httpService.get<
      IResponse<
        Array<{
          franchisePaymentGatewayId: number;
          gatewayCode: string;
          gatewayName: string;
          providerCountryCode: string;
          currencyCode: string;
          isPrimary: boolean;
          supportsDomestic: boolean;
          supportsInternational: boolean;
        }>
      >
    >(`${this.endpoint}/${memberId}/product/supported-gateways`, {
      params: { currency },
    });
    return res.data as Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>;
  }

  async createPaymentLink(
    memberId: number,
    data: ICreatePaymentLinkRequest
  ): Promise<IPaymentLinkResponse> {
    const res = await this.httpService.post<IResponse<IPaymentLinkResponse>>(
      `${this.endpoint}/${memberId}/payment-history/create-payment-link`,
      data
    );
    return res.data as IPaymentLinkResponse;
  }

  async regeneratePaymentLink(
    memberId: number,
    paymentId: number
  ): Promise<IMemberPayment> {
    const res = await this.httpService.post<IResponse<IMemberPayment>>(
      `${this.endpoint}/${memberId}/payment-history/${paymentId}/regenerate-payment-link`
    );
    return res.data as IMemberPayment;
  }

  // endregion
  // region Member Diet Plans
  async getDietPlans(memberId: number): Promise<{
    list: IMemberDietPlan[];
    count: number;
    dietTemplateList: IDropdownItem[];
  }> {
    const res = await this.httpService.get<
      IResponse<{
        list: IMemberDietPlan[];
        count: number;
        dietTemplateList: IDropdownItem[];
      }>
    >(`${this.endpoint}/${memberId}/diet-plan/list`);
    return res.data as {
      list: IMemberDietPlan[];
      count: number;
      dietTemplateList: IDropdownItem[];
    };
  }

  async getDietHistory(memberId: number): Promise<{
    list: IMemberDietPlan[];
    count: number;
  }> {
    const res = await this.httpService.get<
      IResponse<{
        list: IMemberDietPlan[];
        count: number;
      }>
    >(`${this.endpoint}/${memberId}/diet-plan/history`);
    return res.data as {
      list: IMemberDietPlan[];
      count: number;
    };
  }

  async getDietPlanDetail(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo?: number,
    params?: { [key: string]: number }
  ): Promise<{
    recipes: IDropdownItem[];
    diet: IMemberDietDetail;
    memberName: string;
  }> {
    let url = `${this.endpoint}/${memberId}/diet-plan/manage/${dietPlanId}/${cycleNo}`;
    if (dayNo) {
      url = url + `/${dayNo}`;
    }
    const res = await this.httpService.get<
      IResponse<{
        recipes: IDropdownItem[];
        diet: IMemberDietDetail;
        memberName: string;
      }>
    >(url, { params });
    return res.data as {
      recipes: IDropdownItem[];
      diet: IMemberDietDetail;
      memberName: string;
    };
  }

  async createDietPlanDetail(
    memberId: number,
    data: IMemberDietPlanDetail
  ): Promise<void> {
    await this.httpService.post<void>(
      `${this.endpoint}/${memberId}/diet-plan/manage`,
      data
    );
  }

  async updateDietPlanStatus(
    memberId: number,
    dietPlanId: number,
    statusId?: number
  ): Promise<void> {
    await this.httpService.put<void>(
      `${this.endpoint}/${memberId}/diet-plan/update-status/${dietPlanId}`,
      { statusId }
    );
  }

  async deleteDietPlanCycle(
    memberId: number,
    dietPlanId: number,
    cycleNo: number
  ): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/diet-plan/delete-cycle/${dietPlanId}/${cycleNo}`
    );
  }

  async deleteDietPlanDay(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number
  ): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/diet-plan/delete-day/${dietPlanId}/${cycleNo}/${dayNo}`
    );
  }

  async downloadDietPlanCycle(
    memberId: number,
    dietPlanId: number,
    cycleNo: number
  ): Promise<{
    buffer: string;
    fileName: string;
  }> {
    const res = await this.httpService.get<
      IResponse<{
        buffer: string;
        fileName: string;
      }>
    >(
      `${this.endpoint}/${memberId}/diet-plan/download-cycle/${dietPlanId}/${cycleNo}`
    );
    return res.data as { buffer: string; fileName: string };
  }

  async downloadDietPlanDay(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number
  ): Promise<{
    buffer: string;
    fileName: string;
  }> {
    const res = await this.httpService.get<
      IResponse<{
        buffer: string;
        fileName: string;
      }>
    >(
      `${this.endpoint}/${memberId}/diet-plan/download-day/${dietPlanId}/${cycleNo}/${dayNo}`
    );
    return res.data as { buffer: string; fileName: string };
  }

  async sendDietPlanEmailCycle(
    memberId: number,
    dietPlanId: number,
    cycleNo: number
  ): Promise<void> {
    await this.httpService.get<void>(
      `${this.endpoint}/${memberId}/diet-plan/send-email-cycle/${dietPlanId}/${cycleNo}`
    );
  }

  async sendDietPlanEmailDay(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number
  ): Promise<void> {
    await this.httpService.get<void>(
      `${this.endpoint}/${memberId}/diet-plan/send-email-day/${dietPlanId}/${cycleNo}/${dayNo}`
    );
  }

  // region Dashboard APIs
  async getDashboardSummary(
    memberId: number
  ): Promise<IMemberDashboardSummary> {
    const res = await this.httpService.get<IResponse<IMemberDashboardSummary>>(
      `${this.endpoint}/${memberId}/dashboard/summary`
    );
    return res.data as IMemberDashboardSummary;
  }

  async getHealthProgress(memberId: number): Promise<IMemberHealthProgress> {
    const res = await this.httpService.get<IResponse<IMemberHealthProgress>>(
      `${this.endpoint}/${memberId}/health-progress`
    );
    return res.data as IMemberHealthProgress;
  }

  async getEngagement(memberId: number): Promise<IMemberEngagement> {
    const res = await this.httpService.get<IResponse<IMemberEngagement>>(
      `${this.endpoint}/${memberId}/engagement`
    );
    return res.data as IMemberEngagement;
  }

  async getPaymentsSummary(memberId: number): Promise<IMemberPaymentsSummary> {
    const res = await this.httpService.get<IResponse<IMemberPaymentsSummary>>(
      `${this.endpoint}/${memberId}/payments/summary`
    );
    return res.data as IMemberPaymentsSummary;
  }

  async getIssuesSummary(memberId: number): Promise<IMemberIssuesSummary> {
    const res = await this.httpService.get<IResponse<IMemberIssuesSummary>>(
      `${this.endpoint}/${memberId}/issues/summary`
    );
    return res.data as IMemberIssuesSummary;
  }

  // endregion
  // region Member Product Orders
  async getProductMasterData(
    memberId: number
  ): Promise<IMemberProductMasterData> {
    const res = await this.httpService.get<IResponse<IMemberProductMasterData>>(
      `${this.endpoint}/${memberId}/product/master-data`
    );
    return res.data as IMemberProductMasterData;
  }

  async getProductOrders(
    memberId: number
  ): Promise<ITableList<IMemberProduct>> {
    const res = await this.httpService.get<
      IResponse<ITableList<IMemberProduct>>
    >(`${this.endpoint}/${memberId}/product/list`);
    return res.data as ITableList<IMemberProduct>;
  }

  async getProductOrder(
    memberId: number,
    productId: number
  ): Promise<IMemberProduct> {
    const res = await this.httpService.get<IResponse<IMemberProduct>>(
      `${this.endpoint}/${memberId}/product/${productId}`
    );
    return res.data as IMemberProduct;
  }

  async calculateProductTax(
    memberId: number,
    data: ICalculateProductVariantTaxRequest
  ): Promise<ICalculateProductVariantTaxResponse> {
    const res = await this.httpService.post<
      IResponse<ICalculateProductVariantTaxResponse>
    >(`${this.endpoint}/${memberId}/product/calculate-tax`, data);
    return res.data as ICalculateProductVariantTaxResponse;
  }

  async createProductOrder(
    memberId: number,
    data: IManageMemberProduct
  ): Promise<IMemberProduct> {
    const res = await this.httpService.post<IResponse<IMemberProduct>>(
      `${this.endpoint}/${memberId}/product`,
      data
    );
    return res.data as IMemberProduct;
  }

  async downloadProductInvoice(
    memberId: number,
    productId: number
  ): Promise<{
    buffer: string;
    fileName: string;
  }> {
    const res = await this.httpService.get<
      IResponse<{
        buffer: string;
        fileName: string;
      }>
    >(`${this.endpoint}/${memberId}/product/${productId}/invoice`);
    return res.data as { buffer: string; fileName: string };
  }

  async createProductPaymentLink(
    memberId: number,
    data: ICreatePaymentLinkRequest
  ): Promise<IPaymentLinkResponse> {
    const res = await this.httpService.post<IResponse<IPaymentLinkResponse>>(
      `${this.endpoint}/${memberId}/product/create-payment-link`,
      data
    );
    return res.data as IPaymentLinkResponse;
  }

  async regenerateProductPaymentLink(
    memberId: number,
    productId: number
  ): Promise<IMemberProduct> {
    const res = await this.httpService.post<IResponse<IMemberProduct>>(
      `${this.endpoint}/${memberId}/product/${productId}/regenerate-payment-link`
    );
    return res.data as IMemberProduct;
  }

  // endregion
  // region Member Addresses
  async getAddressMasterData(): Promise<IAddressMaster> {
    const res = await this.httpService.get<IResponse<IAddressMaster>>(
      '/address/address-master'
    );
    return res.data as IAddressMaster;
  }

  async getAddresses(memberId: number): Promise<IAddress[]> {
    const res = await this.httpService.get<IResponse<IAddress[]>>(
      `${this.endpoint}/${memberId}/addresses`
    );
    return res.data as IAddress[];
  }

  async getAddress(memberId: number, addressId: number): Promise<IAddress> {
    const res = await this.httpService.get<IResponse<IAddress>>(
      `${this.endpoint}/${memberId}/addresses/${addressId}`
    );
    return res.data as IAddress;
  }

  async createAddress(
    memberId: number,
    data: IManageAddress
  ): Promise<IAddress> {
    const res = await this.httpService.post<IResponse<IAddress>>(
      `${this.endpoint}/${memberId}/addresses`,
      data
    );
    return res.data as IAddress;
  }

  async updateAddress(
    memberId: number,
    addressId: number,
    data: IManageAddress
  ): Promise<IAddress> {
    const res = await this.httpService.put<IResponse<IAddress>>(
      `${this.endpoint}/${memberId}/addresses/${addressId}`,
      data
    );
    return res.data as IAddress;
  }

  async deleteAddress(memberId: number, addressId: number): Promise<void> {
    await this.httpService.delete<void>(
      `${this.endpoint}/${memberId}/addresses/${addressId}`
    );
  }
  // endregion
}
