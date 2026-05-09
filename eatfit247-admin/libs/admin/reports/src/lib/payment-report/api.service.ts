import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IDropdownItem, IPaymentReportFilter, IPaymentReportItem, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class PaymentReportApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/payment';

  async getPaymentReport(params: IPaymentReportFilter): Promise<ITableList<IPaymentReportItem>> {
    const res = await this.httpService.post<ITableList<IPaymentReportItem>>(this.endpoint, params);
    return res.data as ITableList<IPaymentReportItem>;
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async exportPaymentReports(params: IPaymentReportFilter): Promise<Blob> {
    const exportEndpoint = `${this.endpoint}/export`;
    return await this.httpService.postBlob(exportEndpoint, params);
  }

  async exportPaymentReportExcel(params: IPaymentReportFilter): Promise<Blob> {
    const exportEndpoint = `${this.endpoint}/export-excel`;
    return await this.httpService.postBlob(exportEndpoint, params);
  }
}

