import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import {
  IIssueMasterData, IMemberIssue,
  IMemberIssueReportFilter,
  IMemberIssueReportItem,
  IMemberIssueResponse, IResponse,
  ITableList
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class MemberIssuesReportApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor() {
    super();
  }

  async getMemberIssuesReport(
    params: IMemberIssueReportFilter
  ): Promise<ITableList<IMemberIssueReportItem>> {
    const res = await this.httpService.post<ITableList<IMemberIssueReportItem>>(
      `${this.endpoint}/issues-report`,
      params
    );
    return res.data as ITableList<IMemberIssueReportItem>;
  }

  async getIssuesMasterData(): Promise<IIssueMasterData> {
    const res = await this.httpService.get<IIssueMasterData>(
      '/member/issues-master'
    );
    return res.data as IIssueMasterData;
  }

  async getIssues(memberId: number): Promise<IMemberIssue[]> {
    const res = await this.httpService.get<IResponse<IMemberIssue[]>>(
      `${this.endpoint}/${memberId}/issues`
    );
    return res.data as IMemberIssue[];
  }

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
}

