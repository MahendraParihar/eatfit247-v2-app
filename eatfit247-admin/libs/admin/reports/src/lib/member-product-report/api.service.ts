import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IDropdownItem, IMemberProductReportFilter, IMemberProductReportItem, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class MemberProductReportApiService extends ApiBaseService {
  private readonly endpoint = '/reports/member-product';

  async getMemberProductReport(params: IMemberProductReportFilter): Promise<ITableList<IMemberProductReportItem>> {
    const res = await this.httpService.post<ITableList<IMemberProductReportItem>>(this.endpoint, params);
    return res.data as ITableList<IMemberProductReportItem>;
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async getPaymentStatusDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/lov/payment-status/dropdown');
    return res.data as IDropdownItem[];
  }

  async exportMemberProductReports(params: IMemberProductReportFilter): Promise<Blob> {
    const exportEndpoint = `${this.endpoint}/export`;
    return await this.httpService.postBlob(exportEndpoint, params);
  }

  async exportMemberProductReportsBulk(memberProductIds: number[]): Promise<Blob> {
    const exportEndpoint = `${this.endpoint}/export/bulk`;
    return await this.httpService.postBlob(exportEndpoint, { memberProductIds });
  }
}

