import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IPaymentReportContext, IPaymentReportFilter, IPaymentReportResult } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class PaymentReportApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/payment';

  async getPaymentReport(params: IPaymentReportFilter): Promise<IPaymentReportResult> {
    const res = await this.httpService.post<IPaymentReportResult>(this.endpoint, params);
    return res.data as IPaymentReportResult;
  }

  /**
   * Filter-bar bootstrap: FY calendar for the resolved franchise, the franchises this
   * admin may query, and the country list — in one round trip.
   *
   * Replaces the old `/franchise/dropdown` call, which required the Franchise ability
   * and so returned an empty dropdown for report-only roles.
   */
  async getContext(franchiseId?: number): Promise<IPaymentReportContext> {
    const res = await this.httpService.get<IPaymentReportContext>(`${this.endpoint}/context`, {
      params: franchiseId ? { franchiseId } : {}
    });
    return res.data as IPaymentReportContext;
  }

  async exportPaymentReports(params: IPaymentReportFilter): Promise<Blob> {
    return await this.httpService.postBlob(`${this.endpoint}/export`, params);
  }

  async exportPaymentReportExcel(params: IPaymentReportFilter): Promise<Blob> {
    return await this.httpService.postBlob(`${this.endpoint}/export-excel`, params);
  }
}
